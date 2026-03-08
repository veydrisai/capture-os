import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import CalendarClient from "@/components/crm/CalendarClient";

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request);
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, user.id), eq(accounts.provider, "google")));
  return { accessToken: account?.access_token ?? null };
}

export default function CalendarPage({ loaderData }: { loaderData: any }) {
  return <CalendarClient accessToken={loaderData.accessToken} />;
}
