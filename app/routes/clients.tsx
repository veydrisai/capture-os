import { db } from "@/lib/db";
import { clients } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import ClientsClient from "@/app/(dashboard)/clients/ClientsClient";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const data = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return { clients: data };
}

export default function ClientsPage({ loaderData }: { loaderData: any }) {
  return <ClientsClient initialClients={loaderData.clients} />;
}
