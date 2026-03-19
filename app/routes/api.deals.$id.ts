import { db } from "@/lib/db";
import { deals, contacts, workspaceSettings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import { demoDoneAgreementSender, agreementSignedOnboarding, demoBookedAlert } from "@/trigger/deal-automation";

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  await requireUser(request);
  const { id } = params;
  const [deal] = await db.select().from(deals).where(eq(deals.id, id));
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  // Include linked contact if present
  let contact = null;
  if (deal.contactId) {
    const [c] = await db.select().from(contacts).where(eq(contacts.id, deal.contactId));
    contact = c ?? null;
  }

  return Response.json({ ...deal, contact });
}

function clampInt(val: unknown, min = 0, max = 10_000_000): number {
  const n = parseInt(String(val), 10);
  if (isNaN(n)) return 0;
  return Math.min(max, Math.max(min, n));
}

type DealUpdate = Partial<InferInsertModel<typeof deals>>;

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  await requireUser(request);
  const { id } = params;

  if (request.method === "DELETE") {
    await db.delete(deals).where(eq(deals.id, id));
    return Response.json({ ok: true });
  }

  const body = await request.json();
  const [existing] = await db.select().from(deals).where(eq(deals.id, id));
  const now = new Date();

  const updates: DealUpdate = {
    title: body.title,
    stage: body.stage,
    systemType: body.systemType || null,
    value: body.value !== undefined ? clampInt(body.value) : existing?.value ?? 0,
    setupFee: body.setupFee !== undefined ? clampInt(body.setupFee) : existing?.setupFee ?? 0,
    monthlyRetainer: body.monthlyRetainer !== undefined ? clampInt(body.monthlyRetainer) : existing?.monthlyRetainer ?? 0,
    probability: body.probability !== undefined ? clampInt(body.probability, 0, 100) : existing?.probability ?? 0,
    closeDate: body.closeDate ? new Date(body.closeDate) : (body.closeDate === "" ? null : existing?.closeDate),
    notes: body.notes ?? existing?.notes,
    lostReason: body.lostReason || null,
    updatedAt: now,
  };

  if (body.stage && existing?.stage !== body.stage) {
    if (body.stage === "demo_booked" && !existing?.demoBookedAt) updates.demoBookedAt = now;
    if (body.stage === "demo_done" && !existing?.demoDoneAt) updates.demoDoneAt = now;
    if (body.stage === "agreement_signed" && !existing?.agreementSignedAt) updates.agreementSignedAt = now;
  }

  if (body.agreementSentAt !== undefined) updates.agreementSentAt = body.agreementSentAt ? new Date(body.agreementSentAt) : null;
  if (body.agreementSignedAt !== undefined) updates.agreementSignedAt = body.agreementSignedAt ? new Date(body.agreementSignedAt) : null;
  if (body.paymentReceivedAt !== undefined) updates.paymentReceivedAt = body.paymentReceivedAt ? new Date(body.paymentReceivedAt) : null;
  if (body.demoBookedAt !== undefined) updates.demoBookedAt = body.demoBookedAt ? new Date(body.demoBookedAt) : null;
  if (body.demoDoneAt !== undefined) updates.demoDoneAt = body.demoDoneAt ? new Date(body.demoDoneAt) : null;

  const [row] = await db.update(deals).set(updates).where(eq(deals.id, id)).returning();

  const stageChanged = body.stage && existing?.stage !== body.stage;

  if (stageChanged) {
    const [ws] = await db.select().from(workspaceSettings).limit(1);

    // Fetch contact details for email payloads
    let contactEmail: string | null = null;
    let contactName: string | null = null;
    if (row.contactId) {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, row.contactId));
      contactEmail = contact?.email ?? null;
      contactName = contact ? `${contact.firstName} ${contact.lastName}`.trim() : null;
    }

    const basePayload = {
      dealId: row.id,
      dealTitle: row.title,
      contactEmail,
      contactName,
      systemType: row.systemType,
      setupFee: row.setupFee,
      monthlyRetainer: row.monthlyRetainer,
    };

    // ── proposal_sent → send agreement link via Trigger.dev ──────────────────
    if (body.stage === "proposal_sent") {
      try {
        await demoDoneAgreementSender.trigger(basePayload);
      } catch (err) {
        console.error("[deals] demoDoneAgreementSender.trigger failed:", err);
      }
    }

    // ── agreement_signed → kick off onboarding via Trigger.dev ───────────
    if (body.stage === "agreement_signed" && !existing?.webhookFired) {
      // Mark flag FIRST to prevent double-fire if trigger call succeeds but flag update fails
      await db.update(deals).set({ webhookFired: true }).where(eq(deals.id, id));
      try {
        await agreementSignedOnboarding.trigger({
          ...basePayload,
          agreementSignedAt: now.toISOString(),
        });
      } catch (err) {
        console.error("[deals] agreementSignedOnboarding.trigger failed:", err);
      }

      // Keep Make.com webhook alive if still configured
      if (ws?.makeWebhookUrl) {
        try {
          await fetch(ws.makeWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "agreement_signed", dealId: row.id, dealTitle: row.title, systemType: row.systemType, setupFee: row.setupFee, monthlyRetainer: row.monthlyRetainer, timestamp: now.toISOString() }),
          });
        } catch (err) {
          console.error("Make webhook failed:", err);
        }
      }
    }

    // ── demo_booked → internal alert via Trigger.dev ──────────────────────
    if (body.stage === "demo_booked") {
      try {
        await demoBookedAlert.trigger({
          dealId: row.id,
          dealTitle: row.title ?? "",
          contactEmail: basePayload.contactEmail,
          contactName: basePayload.contactName,
          demoBookedAt: (updates.demoBookedAt as Date | undefined)?.toISOString() ?? now.toISOString(),
        });
      } catch (err) {
        console.error("[deals] demoBookedAlert.trigger failed:", err);
      }
    }
  }

  return Response.json(row);
}
