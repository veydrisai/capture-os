import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { deals } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import DealsClient from "./DealsClient";

const getDeals = unstable_cache(
  () => db.select().from(deals).orderBy(desc(deals.updatedAt)),
  ["deals"],
  { revalidate: 30, tags: ["deals"] }
);

export default async function DealsPage() {
  const data = await getDeals();
  return <DealsClient initialDeals={data as Parameters<typeof DealsClient>[0]["initialDeals"]} />;
}
