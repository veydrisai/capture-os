import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { clients } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import ClientsClient from "./ClientsClient";

const getClients = unstable_cache(
  () => db.select().from(clients).orderBy(desc(clients.createdAt)),
  ["clients"],
  { revalidate: 30, tags: ["clients"] }
);

export default async function ClientsPage() {
  const data = await getClients();
  return <ClientsClient initialClients={data as Parameters<typeof ClientsClient>[0]["initialClients"]} />;
}
