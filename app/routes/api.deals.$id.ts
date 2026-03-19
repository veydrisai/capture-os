import { db } from "@/lib/db";
import { deals, contacts, workspaceSettings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import { demoDoneAgreementSender, agreementSignedOnboarding, demoBookedAlert } from "@/trigger/deal-automation";

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

  const updates: Record<string, unknown> = {
    title: body.title,
    stage: body.stage,
    systemType: body.systemType || null,
    value: body.value !== undefined ? parseInt(body.value) || 0 : existing?.value,
    setupFee: body.setupFee !== undefined ? parseInt(body.setupFee) || 0 : existing?.setupFee,
    monthlyRetainer: body.monthlyRetainer !== undefined ? parseInt(body.monthlyRetainer) || 0 : existing?.monthlyRetainer,
    probability: body.probability !== undefined ? parseInt(body.probability) || 0 : existing?.probability,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [row] = await db.update(deals).set(updates as any).where(eq(deals.id, id)).returning();

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
      await demoDoneAgreementSender.trigger(basePayload);
    }

    // ── agreement_signed → kick off onboarding via Trigger.dev ───────────
    if (body.stage === "agreement_signed" && !existing?.webhookFired) {
      await agreementSignedOnboarding.trigger({
        ...basePayload,
        agreementSignedAt: now.toISOString(),
      });
      await db.update(deals).set({ webhookFired: true }).where(eq(deals.id, id));

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
      await demoBookedAlert.trigger({
        dealId: row.id,
        dealTitle: row.title ?? "",
        contactEmail: basePayload.contactEmail,
        contactName: basePayload.contactName,
        demoBookedAt: (updates.demoBookedAt as Date | undefined)?.toISOString() ?? now.toISOString(),
      });
    }
  }

  return Response.json(row);
}
