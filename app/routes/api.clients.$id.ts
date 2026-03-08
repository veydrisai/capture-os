import { db } from "@/lib/db";
import { clients, workspaceSettings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import { triggerN8n } from "@/lib/n8n.server";

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  await requireUser(request);
  const { id } = params;

  if (request.method === "DELETE") {
    await db.delete(clients).where(eq(clients.id, id));
    return Response.json({ ok: true });
  }

  const body = await request.json();
  const [existing] = await db.select().from(clients).where(eq(clients.id, id));

  const [row] = await db.update(clients).set({
    businessName: body.businessName,
    email: body.email || null,
    systemType: body.systemType || null,
    onboardingStatus: body.onboardingStatus,
    monthlyRetainer: body.monthlyRetainer ? parseInt(body.monthlyRetainer) : 0,
    goLiveDate: body.goLiveDate ? new Date(body.goLiveDate) : null,
    nextBillingDate: body.nextBillingDate ? new Date(body.nextBillingDate) : null,
    twilioAccountSid: body.twilioAccountSid || null,
    vapiAssistantId: body.vapiAssistantId || null,
    makeWebhookUrl: body.makeWebhookUrl || null,
    roiDashboardUrl: body.roiDashboardUrl || null,
    notes: body.notes || null,
    complianceNotes: body.complianceNotes || null,
    intakeFormSent: body.intakeFormSent ?? false,
    intakeFormComplete: body.intakeFormComplete ?? false,
    complianceReviewed: body.complianceReviewed ?? false,
    complianceApproved: body.complianceApproved ?? false,
    accountsChecklist: body.accountsChecklist ?? false,
    kickoffScheduled: body.kickoffScheduled ?? false,
    kickoffDone: body.kickoffDone ?? false,
    buildComplete: body.buildComplete ?? false,
    testingComplete: body.testingComplete ?? false,
    softLaunchDone: body.softLaunchDone ?? false,
    updatedAt: new Date(),
  }).where(eq(clients.id, id)).returning();

  // ── client went live → notify n8n ────────────────────────────────────────
  if (
    body.onboardingStatus === "live" &&
    existing?.onboardingStatus !== "live"
  ) {
    const [ws] = await db.select().from(workspaceSettings).limit(1);
    await triggerN8n(ws?.n8nWebhookUrl, "client.live", {
      clientId: row.id,
      businessName: row.businessName,
      email: row.email,
      systemType: row.systemType,
      goLiveDate: row.goLiveDate?.toISOString() ?? new Date().toISOString(),
      roiDashboardUrl: row.roiDashboardUrl,
      monthlyRetainer: row.monthlyRetainer,
      internalEmail: ws?.internalEmail,
    });
  }

  return Response.json(row);
}
