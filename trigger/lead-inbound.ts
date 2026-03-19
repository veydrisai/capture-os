import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { workspaceSettings } from "@/drizzle/schema";

// ── Process Inbound Lead → Internal Alert ─────────────────────────────────
export const processInboundLead = task({
  id: "process-inbound-lead",
  run: async (payload: {
    leadId: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    company?: string | null;
    systemInterest?: string | null;
    source: string;
    notes?: string | null;
  }) => {
    const [ws] = await db.select().from(workspaceSettings).limit(1);
    const internalEmail = ws?.internalEmail ?? process.env.INTERNAL_ALERT_EMAIL ?? "michael@revenuecs.com";
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");

    const { firstName, lastName, email, phone, company, systemInterest, source, notes } = payload;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "CaptureOS <noreply@captureos.app>",
        to: [internalEmail],
        subject: `🔥 New ${source === "cal.com" ? "discovery call" : "inbound lead"} — ${firstName} ${lastName ?? ""}`.trim(),
        html: `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0f0f0f;padding:28px 40px;">
    <p style="color:#fbbf24;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">${source === "cal.com" ? "Discovery Call Booked" : "New Inbound Lead"}</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0;">${firstName} ${lastName ?? ""}</h1>
  </div>
  <div style="padding:32px 40px;">
    <table style="background:#f9fafb;border-radius:8px;width:100%;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 6px;font-size:14px;color:#111827;"><strong>Email:</strong> ${email}</p>
        <p style="margin:0 0 6px;font-size:14px;color:#111827;"><strong>Phone:</strong> ${phone ?? "Not provided"}</p>
        <p style="margin:0 0 6px;font-size:14px;color:#111827;"><strong>Company:</strong> ${company ?? "Not provided"}</p>
        <p style="margin:0 0 6px;font-size:14px;color:#111827;"><strong>Interested in:</strong> ${systemInterest ?? "Not specified"}</p>
        <p style="margin:0;font-size:14px;color:#111827;"><strong>Source:</strong> ${source}</p>
        ${notes ? `<p style="margin-top:8px;font-size:13px;color:#6b7280;">${notes}</p>` : ""}
      </td></tr>
    </table>
    <table style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;width:100%;margin-top:16px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:14px 20px;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">${source === "cal.com" ? "They booked a call — prep for the demo." : "Reach out within the hour."}</p>
      </td></tr>
    </table>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">Lead ID: ${payload.leadId} · CaptureOS</p>
  </div>
</div></body></html>`,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Resend error ${res.status}: ${text}`);
    }

    return { ok: true, email };
  },
});
