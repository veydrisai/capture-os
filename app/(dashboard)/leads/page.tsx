import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import LeadsClient from "./LeadsClient";

const getLeads = unstable_cache(
  () => db.select().from(leads).orderBy(desc(leads.createdAt)),
  ["leads"],
  { revalidate: 30, tags: ["leads"] }
);

export default async function LeadsPage() {
  const data = await getLeads();
  return <LeadsClient initialLeads={data as Parameters<typeof LeadsClient>[0]["initialLeads"]} />;
}
