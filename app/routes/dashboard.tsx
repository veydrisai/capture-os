import { db } from "@/lib/db";
import { deals, clients, activities } from "@/drizzle/schema";
import { count, eq, sql, gte } from "drizzle-orm";
import DashboardClient from "@/app/(dashboard)/dashboard/DashboardClient";
import { requireUser } from "@/app/sessions.server";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [[demosBooked], [demosDone], [agreementsSigned], [clientsLive], [mrrResult], [pipelineValue], recentDeals, recentActivities] =
    await Promise.all([
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
    firstName: user.name.split(" ")[0] ?? "there",
    greeting: getGreeting(),
    stats: {
      demosBooked: demosBooked.count,
      demosDone: demosDone.count,
      agreementsSigned: agreementsSigned.count,
      clientsLive: clientsLive.count,
      mrr: mrrResult.total ?? 0,
      pipelineValue: pipelineValue.total ?? 0,
      recentDeals,
      recentActivities,
    },
  };
}

export default function DashboardPage({ loaderData }: { loaderData: any }) {
  return <DashboardClient firstName={loaderData.firstName} stats={loaderData.stats} greeting={loaderData.greeting} />;
}
