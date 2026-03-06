import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [row] = await db.insert(clients).values({
    businessName: body.businessName,
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
    createdBy: session.user.id,
    assignedTo: session.user.id,
  }).returning();

  revalidateTag("clients"); revalidateTag("dashboard");
  return NextResponse.json(row, { status: 201 });
}
