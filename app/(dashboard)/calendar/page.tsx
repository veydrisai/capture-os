import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import CalendarClient from "@/components/crm/CalendarClient";

async function getAccessToken(userId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));
  return account?.access_token ?? null;
}

export default async function CalendarPage() {
  const session = await auth();
  const accessToken = session?.user?.id ? await getAccessToken(session.user.id) : null;

  return <CalendarClient accessToken={accessToken} />;
}
