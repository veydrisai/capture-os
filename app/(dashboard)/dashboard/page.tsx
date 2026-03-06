import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals, clients, activities } from "@/drizzle/schema";
import { count, eq, sql, gte } from "drizzle-orm";
import DashboardClient from "./DashboardClient";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const getDashboardStats = unstable_cache(
  async () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      [demosBooked], [demosDone], [agreementsSigned], [clientsLive],
      [mrrResult], [pipelineValue], recentDeals, recentActivities,
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

    return {
      demosBooked: demosBooked.count,
      demosDone: demosDone.count,
      agreementsSigned: agreementsSigned.count,
      clientsLive: clientsLive.count,
      mrr: mrrResult.total ?? 0,
      pipelineValue: pipelineValue.total ?? 0,
      recentDeals,
      recentActivities,
    };
  },
  ["dashboard-stats"],
  { revalidate: 30, tags: ["dashboard"] }
);

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();
  const stats = await getDashboardStats();
  return <DashboardClient firstName={firstName} stats={stats as Parameters<typeof DashboardClient>[0]["stats"]} greeting={greeting} />;
}
