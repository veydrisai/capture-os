import { db } from "@/lib/db";
import { activities } from "@/drizzle/schema";
import { requireUser } from "@/app/sessions.server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "CaptureOS <onboarding@resend.dev>";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Return JSON 401 instead of redirect so fetch() callers get a proper response
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!RESEND_API_KEY) {
    return Response.json({ error: "RESEND_API_KEY is not configured on the server" }, { status: 500 });
  }

  let body: { to: string; subject: string; html: string; contactId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { to, subject, html, contactId } = body;

  if (!to || !subject || !html) {
    return Response.json({ error: "to, subject, and html are required" }, { status: 400 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    let errBody = "";
    try {
      const errJson = await res.json();
      errBody = errJson?.message ?? errJson?.name ?? JSON.stringify(errJson);
    } catch {
      errBody = await res.text().catch(() => `HTTP ${res.status}`);
    }
    console.error("[send-email] Resend API error:", res.status, errBody);
    return Response.json(
      { error: `Email delivery failed: ${errBody}` },
      { status: 502 },
    );
  }

  const result = await res.json();

  // Log as activity — non-blocking so a DB hiccup doesn't fail the send
  if (contactId) {
    db.insert(activities).values({
      type: "email",
      title: subject,
      body: html.replace(/<[^>]+>/g, ""),
      contactId,
      createdBy: user.id,
    }).catch((err) => console.error("[send-email] activity log failed:", err));
  }

  return Response.json({ ok: true, id: result.id });
}
