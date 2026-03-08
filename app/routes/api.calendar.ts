import { google } from "googleapis";
import { db } from "@/lib/db";
import { accounts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/app/sessions.server";
import { getOAuth2Client } from "@/lib/google";

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request);

  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, user.id), eq(accounts.provider, "google")));

  if (!account?.access_token) {
    return Response.json({ error: "No Google account connected" }, { status: 401 });
  }

  const url = new URL(request.url);
  const timeMin = url.searchParams.get("timeMin");
  const timeMax = url.searchParams.get("timeMax");

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Auto-refresh token if expired
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await db
        .update(accounts)
        .set({
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        })
        .where(and(eq(accounts.userId, user.id), eq(accounts.provider, "google")));
    }
  });

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin ?? new Date().toISOString(),
      timeMax: timeMax ?? undefined,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return Response.json({ items: res.data.items ?? [] });
  } catch (err: any) {
    console.error("Calendar fetch error:", err?.message);
    return Response.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}
