import { db } from "@/lib/db";
import { activities } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import ActivityClient from "./ActivityClient";

export default async function ActivityPage() {
  const data = await db.select().from(activities).orderBy(desc(activities.createdAt));
  return <ActivityClient initialActivities={data as Parameters<typeof ActivityClient>[0]["initialActivities"]} />;
}
