import { db } from "@/lib/db";
import { clients } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import ClientsClient from "./ClientsClient";

export default async function ClientsPage() {
  const data = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return <ClientsClient initialClients={data as Parameters<typeof ClientsClient>[0]["initialClients"]} />;
}
