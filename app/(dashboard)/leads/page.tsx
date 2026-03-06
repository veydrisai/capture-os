import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import LeadsClient from "./LeadsClient";

export default async function LeadsPage() {
  const data = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return <LeadsClient initialLeads={data as Parameters<typeof LeadsClient>[0]["initialLeads"]} />;
}
