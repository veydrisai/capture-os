import { db } from "@/lib/db";
import { deals, contacts, workspaceSettings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import { triggerN8n } from "@/lib/n8n.server";

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

    // ── proposal_sent → rep confirmed prospect is ready, auto-send agreement ─
    if (body.stage === "proposal_sent") {
      await triggerN8n(ws?.n8nWebhookUrl, "deal.proposal_sent", {
        ...basePayload,
        agreementTemplateUrl: ws?.agreementTemplateUrl,
        internalEmail: ws?.internalEmail,
      });
    }

    // ── agreement_signed → kick off onboarding + intake form ───────────────
    if (body.stage === "agreement_signed" && !existing?.webhookFired) {
      await triggerN8n(ws?.n8nWebhookUrl, "deal.agreement_signed", {
        ...basePayload,
        intakeFormUrl: ws?.intakeFormUrl,
        internalEmail: ws?.internalEmail,
        agreementSignedAt: now.toISOString(),
      });
      await db.update(deals).set({ webhookFired: true }).where(eq(deals.id, id));

      // Keep existing Make.com webhook alive if still configured
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

    // ── demo_booked → confirmation email ───────────────────────────────────
    if (body.stage === "demo_booked") {
      await triggerN8n(ws?.n8nWebhookUrl, "deal.demo_booked", {
        ...basePayload,
        demoBookedAt: (updates.demoBookedAt as Date | undefined)?.toISOString() ?? now.toISOString(),
        internalEmail: ws?.internalEmail,
      });
    }
  }

  return Response.json(row);
}
