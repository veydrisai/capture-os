import { db } from "@/lib/db";
import { leads } from "@/drizzle/schema";

/**
 * Cal.com webhook endpoint — receives BOOKING_CREATED events directly.
 * Bypasses n8n. Creates lead in DB + fires internal alert email via SMTP.
 * Configure in Cal.com: Webhook URL = https://captureos.app/api/cal-webhook
 */
export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // Only process booking creations
  if (data.triggerEvent !== "BOOKING_CREATED") {
    return Response.json({ ok: true, skipped: true });
  }

  try {
  const payload = data.payload as Record<string, unknown> | undefined;
  const attendees = payload?.attendees as Array<Record<string, string>> | undefined;
  const attendee = attendees?.[0];

  if (!attendee?.email) {
    return Response.json({ error: "No attendee email in payload" }, { status: 400 });
  }

  const firstName = attendee?.firstName || attendee?.name?.split(" ")[0] || "Unknown";
  const lastName = attendee?.lastName || attendee?.name?.split(" ").slice(1).join(" ") || "";
  const email = attendee?.email ?? "";
  const responses = payload?.responses as Record<string, { value: string }> | undefined;
  const userFieldsResponses = payload?.userFieldsResponses as Record<string, { value: string }> | undefined;
  const phone = responses?.phone?.value || userFieldsResponses?.phone?.value || null;
  const company = responses?.company?.value || userFieldsResponses?.company?.value || null;
  const VALID_SYSTEM_TYPES = ["reactivation", "hot_lead", "backend", "combo"] as const;
  const rawInterest = responses?.systemInterest?.value || userFieldsResponses?.systemInterest?.value;
  const systemInterest = rawInterest && VALID_SYSTEM_TYPES.includes(rawInterest as typeof VALID_SYSTEM_TYPES[number]) ? rawInterest as typeof VALID_SYSTEM_TYPES[number] : null;
  const notes = `Cal.com booking — ${(payload?.title as string) ?? "Call"} on ${(payload?.startTime as string) ?? "TBD"}${rawInterest ? ` | Interested in: ${rawInterest}` : ""}`;

  // Create lead in DB
  const [row] = await db.insert(leads).values({
    firstName,
    lastName,
    email,
    phone: phone || null,
    company: company || null,
    industry: null,
    systemInterest: systemInterest || null,
    notes,
    source: "cal.com",
    status: "new",
  }).returning();

  // Send internal alert email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  const alertTo = process.env.INTERNAL_ALERT_EMAIL ?? "michael@revenuecs.com";

  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CaptureOS <noreply@captureos.app>",
          to: [alertTo],
        subject: `🔥 New discovery call booked — ${firstName} ${lastName}`,
          html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="background:#0f0f0f;padding:28px 40px;">
  <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.1em;color:#fbbf24;text-transform:uppercase;">New Discovery Call Booked</p>
  <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">${firstName} ${lastName}</h1>
</td></tr>
<tr><td style="padding:32px 40px;">
  <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;width:100%;margin-bottom:24px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Lead details</p>
      <p style="margin:0 0 4px;font-size:14px;color:#111827;"><strong>Email:</strong> ${email}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#111827;"><strong>Phone:</strong> ${phone || "Not provided"}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#111827;"><strong>Company:</strong> ${company || "Not provided"}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#111827;"><strong>Interested in:</strong> ${systemInterest}</p>
      <p style="margin:0;font-size:14px;color:#111827;"><strong>Booking:</strong> ${notes}</p>
    </td></tr>
  </table>
  <table cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;width:100%;margin-bottom:24px;">
    <tr><td style="padding:14px 20px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">⚡ They booked a call — confirm in Cal.com and prep for the demo.</p>
    </td></tr>
  </table>
  <p style="margin:0;font-size:13px;color:#6b7280;">Lead auto-created in CaptureOS. Source: cal.com | Lead ID: ${row.id}</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e5e7eb;">
  <p style="margin:0;font-size:13px;color:#9ca3af;">RevenueCS — captureos.app</p>
</td></tr>
</table></td></tr></table></body></html>`,
        }),
      });
    } catch (err) {
      console.error("[cal-webhook] Email send failed:", err);
    }
  }

  return Response.json({ ok: true, leadId: row.id });
  } catch (err) {
    console.error("[cal-webhook] Error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
