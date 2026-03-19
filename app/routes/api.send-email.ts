import { db } from "@/lib/db";
import { activities } from "@/drizzle/schema";
import { requireUser } from "@/app/sessions.server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "CaptureOS <onboarding@resend.dev>";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireUser(request);

  if (!RESEND_API_KEY) {
    return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
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
    const err = await res.text().catch(() => "");
    return Response.json({ error: `Resend error: ${err}` }, { status: 502 });
  }

  const result = await res.json();

  // Log as activity
  if (contactId) {
    await db.insert(activities).values({
      type: "email",
      title: subject,
      body: html.replace(/<[^>]+>/g, ""),
      contactId,
      createdBy: user.id,
    });
  }

  return Response.json({ ok: true, id: result.id });
}
