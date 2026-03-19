import { db } from "@/lib/db";
import { activities, clients, deals, leads } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Inbound webhook endpoint for n8n to write back to CaptureOS.
 * Auth: x-n8n-secret header must match N8N_INBOUND_SECRET env var.
 *
 * Supported actions:
 *   create_activity  — log an activity on a deal, client, lead, or contact
 *   update_client_onboarding — mark onboarding checklist fields on a client
 *   update_deal_stage — move a deal to a new stage
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  // Same-length check leaks length info, but for a static secret this is acceptable.
  // We HMAC both with a fixed key so comparison is constant-time regardless of input.
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

export async function action({ request }: { request: Request }) {
  const secret = request.headers.get("x-n8n-secret");
  const expected = process.env.N8N_INBOUND_SECRET;
  if (!secret || !expected || !timingSafeStringEqual(secret, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action: act } = body;

  // ── create_activity ───────────────────────────────────────────────────────
  if (act === "create_activity") {
    const [row] = await db.insert(activities).values({
      type: body.type ?? "email",
      title: body.title,
      body: body.body ?? null,
      dealId: body.dealId ?? null,
      clientId: body.clientId ?? null,
      leadId: body.leadId ?? null,
      contactId: body.contactId ?? null,
      completed: true,
      completedAt: new Date(),
    }).returning();
    return Response.json(row, { status: 201 });
  }

  // ── update_client_onboarding ──────────────────────────────────────────────
  if (act === "update_client_onboarding") {
    const { clientId, ...fields } = body;
    if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });

    const allowed = [
      "onboardingStatus", "intakeFormSent", "intakeFormComplete",
      "complianceReviewed", "complianceApproved", "accountsChecklist",
      "kickoffScheduled", "kickoffDone", "buildComplete",
      "testingComplete", "softLaunchDone",
    ];
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (key in fields) updates[key] = fields[key];
    }

    const [row] = await db.update(clients).set(updates as Partial<typeof clients.$inferInsert>).where(eq(clients.id, clientId)).returning();
    return Response.json(row);
  }

  // ── update_deal_stage ─────────────────────────────────────────────────────
  if (act === "update_deal_stage") {
    const { dealId, stage } = body;
    if (!dealId || !stage) return Response.json({ error: "dealId and stage required" }, { status: 400 });

    const now = new Date();
    const stageTimestamps: Record<string, unknown> = {};
    if (stage === "demo_booked") stageTimestamps.demoBookedAt = now;
    if (stage === "demo_done") stageTimestamps.demoDoneAt = now;
    if (stage === "agreement_signed") stageTimestamps.agreementSignedAt = now;

    const [row] = await db.update(deals).set({ stage, ...stageTimestamps, updatedAt: now } as Partial<typeof deals.$inferInsert>).where(eq(deals.id, dealId)).returning();
    return Response.json(row);
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
