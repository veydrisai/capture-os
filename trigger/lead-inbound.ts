import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { workspaceSettings } from "@/drizzle/schema";
import { escHtml } from "@/lib/html";

const systemTypeLabel: Record<string, string> = {
  reactivation: "Reactivation System",
  hot_lead: "Hot Lead System",
  backend: "Backend Nurture System",
  combo: "Full Revenue Stack",
};

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

    const isCall = source === "cal.com";
    const fullName = escHtml(`${firstName} ${lastName ?? ""}`.trim());
    const systemLabel = escHtml(systemInterest ? systemTypeLabel[systemInterest] ?? systemInterest : null);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Michael @ RevenueCS <michael@revenuecs.com>",
        to: [internalEmail],
        subject: isCall
          ? `📅 Discovery call booked — ${escHtml(firstName)} ${escHtml(lastName ?? "")}`
          : `🔥 New lead — ${escHtml(firstName)} ${escHtml(lastName ?? "")}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">

  <!-- Header -->
  <tr><td style="background:${isCall ? "#0a0a0a" : "#1a0a0a"};padding:24px 32px 20px;">
    <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:${isCall ? "#a8ff47" : "#fb923c"};text-transform:uppercase;">
      ${isCall ? "Discovery Call Booked" : "Inbound Lead — Respond Fast"}
    </p>
    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${fullName}</h1>
    ${company ? `<p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.45);">${escHtml(company)}</p>` : ""}
  </td></tr>

  <!-- Lead details -->
  <tr><td style="padding:24px 32px;">
    <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background:#f9fafb;"><td colspan="2" style="padding:12px 16px;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;">Lead Information</td></tr>
      <tr><td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:100px;">Email</td>
          <td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:500;">${escHtml(email)}</td></tr>
      ${phone ? `<tr><td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Phone</td>
          <td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:500;">${escHtml(phone)}</td></tr>` : ""}
      ${company ? `<tr><td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Company</td>
          <td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:500;">${escHtml(company)}</td></tr>` : ""}
      ${systemLabel ? `<tr><td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Interested in</td>
          <td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#6366f1;font-weight:600;">${systemLabel}</td></tr>` : ""}
      <tr><td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Source</td>
          <td style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:13px;color:#111827;">${escHtml(source)}</td></tr>
      ${notes ? `<tr><td colspan="2" style="padding:11px 16px;border-top:1px solid #f3f4f6;font-size:12px;color:#6b7280;line-height:1.5;">${escHtml(notes)}</td></tr>` : ""}
    </table>
  </td></tr>

  <!-- Action banner -->
  <tr><td style="padding:0 32px 24px;">
    <div style="background:${isCall ? "#f0fdf4" : "#fff7ed"};border:1px solid ${isCall ? "#bbf7d0" : "#fed7aa"};border-radius:8px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:${isCall ? "#166534" : "#9a3412"};">
        ${isCall ? "✅ They booked a call — confirm in Cal.com, prep for demo, send reminder 1 hr before." : "⚡ Reach out in the next 60 minutes while they're warm."}
      </p>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:14px 32px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Lead ID: ${payload.leadId} · CaptureOS · ${new Date().toLocaleString()}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
      }),
    });

    if (!res.ok) {
      let detail = "";
      try { const j = await res.json(); detail = j?.message ?? j?.name ?? JSON.stringify(j); }
      catch { detail = await res.text().catch(() => `HTTP ${res.status}`); }
      const hint = res.status === 422 || detail.includes("expected pattern") || detail.includes("domain")
        ? " → Verify your domain at resend.com/domains and set RESEND_FROM_EMAIL in Trigger.dev env vars"
        : "";
      throw new Error(`Resend ${res.status}: ${detail}${hint}`);
    }

    return { ok: true, email };
  },
});
