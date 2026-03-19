import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  const rows = status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await db.select().from(clients).where(eq(clients.onboardingStatus, status as any)).orderBy(desc(clients.createdAt)).limit(limit).offset(offset)
    : await db.select().from(clients).orderBy(desc(clients.createdAt)).limit(limit).offset(offset);

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
    contactId: body.contactId || null,
    dealId: body.dealId || null,
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
    createdBy: session.user.id,
    assignedTo: session.user.id,
  }).returning();

  revalidateTag("clients"); revalidateTag("dashboard");
  return NextResponse.json(row, { status: 201 });
}
