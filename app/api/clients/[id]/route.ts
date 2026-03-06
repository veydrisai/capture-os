import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  // Scalar fields
  if (body.businessName !== undefined) updates.businessName = body.businessName;
  if (body.systemType !== undefined) updates.systemType = body.systemType || null;
  if (body.onboardingStatus !== undefined) updates.onboardingStatus = body.onboardingStatus;
  if (body.monthlyRetainer !== undefined) updates.monthlyRetainer = parseInt(body.monthlyRetainer) || 0;
  if (body.twilioAccountSid !== undefined) updates.twilioAccountSid = body.twilioAccountSid || null;
  if (body.vapiAssistantId !== undefined) updates.vapiAssistantId = body.vapiAssistantId || null;
  if (body.makeWebhookUrl !== undefined) updates.makeWebhookUrl = body.makeWebhookUrl || null;
  if (body.roiDashboardUrl !== undefined) updates.roiDashboardUrl = body.roiDashboardUrl || null;
  if (body.notes !== undefined) updates.notes = body.notes || null;
  if (body.complianceNotes !== undefined) updates.complianceNotes = body.complianceNotes || null;
  if (body.goLiveDate !== undefined) updates.goLiveDate = body.goLiveDate ? new Date(body.goLiveDate) : null;
  if (body.nextBillingDate !== undefined) updates.nextBillingDate = body.nextBillingDate ? new Date(body.nextBillingDate) : null;

  // Checklist booleans
  const checklistFields = [
    "intakeFormSent", "intakeFormComplete", "complianceReviewed", "complianceApproved",
    "accountsChecklist", "kickoffScheduled", "kickoffDone", "buildComplete",
    "testingComplete", "softLaunchDone",
  ];
  for (const field of checklistFields) {
    if (body[field] !== undefined) updates[field] = Boolean(body[field]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [row] = await db.update(clients).set(updates as any).where(eq(clients.id, id)).returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(clients).where(eq(clients.id, id));
  return NextResponse.json({ ok: true });
}
