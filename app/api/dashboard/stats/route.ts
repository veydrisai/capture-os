import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, deals, clients, activities } from "@/drizzle/schema";
import { count, eq, sql, gte, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Start of current week (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);

  // Start of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    [demosBooked],
    [demosDone],
    [agreementsSigned],
    [clientsLive],
    [mrrResult],
    [pipelineValue],
    recentDeals,
    recentActivities,
  ] = await Promise.all([
    db.select({ count: count() }).from(deals).where(gte(deals.demoBookedAt, weekStart)),
    db.select({ count: count() }).from(deals).where(gte(deals.demoDoneAt, weekStart)),
    db.select({ count: count() }).from(deals).where(gte(deals.agreementSignedAt, monthStart)),
    db.select({ count: count() }).from(clients).where(eq(clients.onboardingStatus, "live")),
    db.select({ total: sql<number>`COALESCE(SUM(${clients.monthlyRetainer}),0)` }).from(clients).where(eq(clients.onboardingStatus, "live")),
    db.select({ total: sql<number>`COALESCE(SUM(${deals.value}),0)` }).from(deals).where(sql`${deals.stage} NOT IN ('lost')`),
    db.select().from(deals).orderBy(sql`${deals.updatedAt} DESC`).limit(6),
    db.select().from(activities).orderBy(sql`${activities.createdAt} DESC`).limit(8),
  ]);

  return NextResponse.json(
    {
      demosBooked: demosBooked.count,
      demosDone: demosDone.count,
      agreementsSigned: agreementsSigned.count,
      clientsLive: clientsLive.count,
      mrr: mrrResult.total ?? 0,
      pipelineValue: pipelineValue.total ?? 0,
      recentDeals,
      recentActivities,
    },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
  );
}
