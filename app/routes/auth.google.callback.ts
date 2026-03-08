import { redirect } from "react-router";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/google";
import { db } from "@/lib/db";
import { users, accounts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { sessionStorage } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) return redirect("/login?error=oauth_denied");

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    if (!userInfo.email) return redirect("/login?error=no_email");

    // Upsert user
    const [existing] = await db.select().from(users).where(eq(users.email, userInfo.email));
    let userId: string;

    if (existing) {
      userId = existing.id;
      await db.update(users).set({
        name: userInfo.name ?? existing.name,
        image: userInfo.picture ?? existing.image,
      }).where(eq(users.id, userId));
    } else {
      const [created] = await db.insert(users).values({
        email: userInfo.email,
        name: userInfo.name ?? null,
        image: userInfo.picture ?? null,
      }).returning();
      userId = created.id;
    }

    // Upsert Google account (stores tokens for Calendar access)
    const providerAccountId = userInfo.id!;
    const [existingAcct] = await db.select().from(accounts).where(eq(accounts.providerAccountId, providerAccountId));

    if (existingAcct) {
      await db.update(accounts).set({
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token ?? existingAcct.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
      }).where(eq(accounts.providerAccountId, providerAccountId));
    } else {
      await db.insert(accounts).values({
        userId,
        type: "oauth",
        provider: "google",
        providerAccountId,
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        scope: tokens.scope ?? null,
        token_type: tokens.token_type ?? null,
        id_token: tokens.id_token ?? null,
      });
    }

    // Set session cookie
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    session.set("userId", userId);
    session.set("userName", userInfo.name ?? "");
    session.set("userEmail", userInfo.email);
    session.set("userImage", userInfo.picture ?? "");

    return redirect("/dashboard", {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    return redirect("/login?error=oauth_failed");
  }
}
