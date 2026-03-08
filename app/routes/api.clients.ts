import { db } from "@/lib/db";
import { clients } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const query = db.select().from(clients).orderBy(desc(clients.createdAt));
  const rows = status
    ? await db.select().from(clients).where(eq(clients.onboardingStatus, status as "live" | "pending" | "intake_sent" | "intake_complete" | "compliance_review" | "compliance_approved" | "building" | "testing" | "soft_launch")).orderBy(desc(clients.createdAt))
    : await query;

  return Response.json(rows);
}

export async function action({ request }: { request: Request }) {
  const user = await requireUser(request);
  const body = await request.json();
  const [row] = await db.insert(clients).values({
    businessName: body.businessName,
    email: body.email || null,
    systemType: body.systemType || null,
    onboardingStatus: body.onboardingStatus ?? "pending",
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
    dealId: body.dealId || null,
    contactId: body.contactId || null,
    createdBy: user.id,
    assignedTo: user.id,
  }).returning();
  return Response.json(row, { status: 201 });
}
