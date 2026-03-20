import { db } from "@/lib/db";
import { deals } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import DealsClient from "@/app/(dashboard)/deals/DealsClient";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const data = await db.select().from(deals).orderBy(desc(deals.createdAt)).limit(500);
  return Response.json(
    { deals: data },
    { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } },
  );
}

export default function DealsPage({ loaderData }: { loaderData: any }) {
  return <DealsClient initialDeals={loaderData.deals} />;
}
