import { db } from "@/lib/db";
import { activities } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import ActivityClient from "@/app/(dashboard)/activity/ActivityClient";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const data = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50);
  return { activities: data };
}

export default function ActivityPage({ loaderData }: { loaderData: any }) {
  return <ActivityClient initialActivities={loaderData.activities} />;
}
