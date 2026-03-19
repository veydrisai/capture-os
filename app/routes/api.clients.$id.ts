import { db } from "@/lib/db";
import { clients, workspaceSettings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import { clientGoLive } from "@/trigger/client-live";

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

  // ── client went live → fire Trigger.dev task ─────────────────────────────
  if (
    body.onboardingStatus === "live" &&
    existing?.onboardingStatus !== "live"
  ) {
    try {
      await clientGoLive.trigger({
        clientId: row.id,
        businessName: row.businessName,
        email: row.email ?? null,
        systemType: row.systemType ?? null,
        goLiveDate: row.goLiveDate?.toISOString() ?? new Date().toISOString(),
        roiDashboardUrl: row.roiDashboardUrl ?? null,
        monthlyRetainer: row.monthlyRetainer ?? null,
      });
    } catch (err) {
      console.error("[clients] clientGoLive.trigger failed:", err);
    }
  }

  return Response.json(row);
}
