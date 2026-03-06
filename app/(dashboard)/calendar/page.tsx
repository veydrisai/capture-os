import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import CalendarClient from "@/components/crm/CalendarClient";

function getAccessToken(userId: string) {
  return unstable_cache(
    async () => {
      const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));
      return account?.access_token ?? null;
    },
    [`google-token-${userId}`],
    { revalidate: 3600, tags: [`google-token-${userId}`] }
  )();
}

export default async function CalendarPage() {
  const session = await auth();
  const accessToken = session?.user?.id ? await getAccessToken(session.user.id) : null;

  return <CalendarClient accessToken={accessToken} />;
}
