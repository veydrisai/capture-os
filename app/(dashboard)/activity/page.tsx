import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { activities } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import ActivityClient from "./ActivityClient";

const getActivities = unstable_cache(
  () => db.select().from(activities).orderBy(desc(activities.createdAt)),
  ["activities"],
  { revalidate: 30, tags: ["activities"] }
);

export default async function ActivityPage() {
  const data = await getActivities();
  return <ActivityClient initialActivities={data as Parameters<typeof ActivityClient>[0]["initialActivities"]} />;
}
