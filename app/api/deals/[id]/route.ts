import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals, workspaceSettings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [row] = await db.select().from(deals).where(eq(deals.id, id));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Fetch existing to check stage transition
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

  // Auto-stamp timestamps on stage transitions
  if (body.stage && existing?.stage !== body.stage) {
    if (body.stage === "demo_booked" && !existing?.demoBookedAt) updates.demoBookedAt = now;
    if (body.stage === "demo_done" && !existing?.demoDoneAt) updates.demoDoneAt = now;
    if (body.stage === "agreement_signed" && !existing?.agreementSignedAt) updates.agreementSignedAt = now;
  }

  // Manual date overrides
  if (body.agreementSentAt !== undefined) updates.agreementSentAt = body.agreementSentAt ? new Date(body.agreementSentAt) : null;
  if (body.agreementSignedAt !== undefined) updates.agreementSignedAt = body.agreementSignedAt ? new Date(body.agreementSignedAt) : null;
  if (body.paymentReceivedAt !== undefined) updates.paymentReceivedAt = body.paymentReceivedAt ? new Date(body.paymentReceivedAt) : null;
  if (body.demoBookedAt !== undefined) updates.demoBookedAt = body.demoBookedAt ? new Date(body.demoBookedAt) : null;
  if (body.demoDoneAt !== undefined) updates.demoDoneAt = body.demoDoneAt ? new Date(body.demoDoneAt) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [row] = await db.update(deals).set(updates as any).where(eq(deals.id, id)).returning();

  // Fire Make.com webhook when deal moves to agreement_signed (only once)
  if (body.stage === "agreement_signed" && existing?.stage !== "agreement_signed" && !existing?.webhookFired) {
    try {
      const [ws] = await db.select().from(workspaceSettings).limit(1);
      if (ws?.makeWebhookUrl) {
        await fetch(ws.makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "agreement_signed",
            dealId: row.id,
            dealTitle: row.title,
            systemType: row.systemType,
            setupFee: row.setupFee,
            monthlyRetainer: row.monthlyRetainer,
            timestamp: now.toISOString(),
          }),
        });
        await db.update(deals).set({ webhookFired: true }).where(eq(deals.id, id));
      }
    } catch (err) {
      console.error("Make webhook failed:", err);
    }
  }

  revalidateTag("deals"); revalidateTag("dashboard");
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(deals).where(eq(deals.id, id));
  revalidateTag("deals"); revalidateTag("dashboard");
  return NextResponse.json({ ok: true });
}
