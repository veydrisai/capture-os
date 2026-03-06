import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin") ?? new Date().toISOString();
  const timeMax = searchParams.get("timeMax") ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, session.user.id), eq(accounts.provider, "google")));

  if (!account?.accessToken) {
    return NextResponse.json({ items: [] });
  }

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "100");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${account.accessToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ items: [] });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
