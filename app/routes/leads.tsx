import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import LeadsClient from "@/app/(dashboard)/leads/LeadsClient";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const data = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return { leads: data };
}

export default function LeadsPage({ loaderData }: { loaderData: any }) {
  return <LeadsClient initialLeads={loaderData.leads} />;
}
