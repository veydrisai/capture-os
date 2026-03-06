import { db } from "@/lib/db";
import { deals } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import DealsClient from "./DealsClient";

export default async function DealsPage() {
  const data = await db.select().from(deals).orderBy(desc(deals.updatedAt));
  return <DealsClient initialDeals={data as Parameters<typeof DealsClient>[0]["initialDeals"]} />;
}
