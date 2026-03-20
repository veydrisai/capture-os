import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { workspaceSettings } from "@/drizzle/schema";
import { escHtml } from "@/lib/html";

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY env var is not set in Trigger.dev project settings");
  // Use RESEND_FROM_EMAIL env var if set, otherwise fall back to verified revenuecs.com sender.
  const from = process.env.RESEND_FROM_EMAIL ?? "Michael @ RevenueCS <michael@revenuecs.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    let detail = "";
    try { const j = await res.json(); detail = j?.message ?? j?.name ?? JSON.stringify(j); }
    catch { detail = await res.text().catch(() => `HTTP ${res.status}`); }
    const hint = res.status === 422 || detail.includes("expected pattern") || detail.includes("domain")
      ? " → Verify your domain at resend.com/domains and set RESEND_FROM_EMAIL=noreply@yourdomain.com in Trigger.dev env vars"
      : "";
    throw new Error(`Resend ${res.status}: ${detail}${hint}`);
  }
}

interface DealPayload {
  dealId: string;
  dealTitle: string;
  contactEmail: string | null;
  contactName: string | null;
  systemType: string | null;
  setupFee: number | null;
  monthlyRetainer: number | null;
}

const systemTypeLabel: Record<string, string> = {
  reactivation: "Reactivation System",
  hot_lead: "Hot Lead System",
  backend: "Backend Nurture System",
  combo: "Full Revenue Stack",
};

// ── Demo Done → Send Agreement Link ────────────────────────────────────────
export const demoDoneAgreementSender = task({
  id: "demo-done-agreement-sender",
  run: async (payload: DealPayload) => {
    const [ws] = await db.select().from(workspaceSettings).limit(1);
    const { contactEmail, contactName, dealTitle, systemType, setupFee, monthlyRetainer } = payload;
    const internalEmail = ws?.internalEmail ?? process.env.INTERNAL_ALERT_EMAIL ?? "michael@revenuecs.com";
    const agreementUrl = ws?.agreementTemplateUrl;
    const firstName = escHtml(contactName?.split(" ")[0] ?? "there");
    const systemLabel = escHtml(systemType ? systemTypeLabel[systemType] ?? systemType : "Revenue System");

    // 1. Send agreement link to prospect
    if (contactEmail && agreementUrl) {
      await sendEmail(
        contactEmail,
        `Your agreement is ready, ${escHtml(contactName?.split(" ")[0] ?? "there")}`,
        `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr><td style="background:#0a0a0a;padding:36px 48px 32px;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#a8ff47;text-transform:uppercase;">Agreement Ready to Sign</p>
    <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;">Ready when you are, ${firstName}.</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 48px 32px;">
    <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.65;">
      Great talking through everything on our call. Your <strong>${systemLabel}</strong> is ready to build — the only thing left is your signature.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65;">
      The agreement covers exactly what we discussed. No surprises, no locked contracts — just a clear scope so we can start building immediately.
    </p>

    <!-- Investment Summary -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border-radius:10px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#9ca3af;text-transform:uppercase;">Your Investment Summary</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#6b7280;padding-bottom:8px;">System</td>
            <td style="font-size:13px;color:#111827;font-weight:600;text-align:right;padding-bottom:8px;">${systemLabel}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;padding-bottom:8px;">One-time setup</td>
            <td style="font-size:13px;color:#111827;font-weight:600;text-align:right;padding-bottom:8px;">$${setupFee ?? 0}</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#111827;font-weight:700;padding-top:8px;border-top:1px solid #e5e7eb;">Monthly</td>
            <td style="font-size:14px;color:#6366f1;font-weight:700;text-align:right;padding-top:8px;border-top:1px solid #e5e7eb;">$${monthlyRetainer ?? 0}/mo</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0">
      <tr><td style="border-radius:10px;background:#0a0a0a;">
        <a href="${escHtml(agreementUrl)}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
          Review &amp; Sign Agreement →
        </a>
      </td></tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
      Takes less than 2 minutes. Once signed, we schedule your kickoff and start building within the week.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:20px 48px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Just reply to this email — I'm here. — Michael, RevenueCS</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
      );
    }

    // 2. Internal alert
    await sendEmail(
      internalEmail,
      `⚡ Agreement sent — ${escHtml(contactName ?? contactEmail ?? "unknown")}`,
      `<div style="font-family:-apple-system,sans-serif;max-width:480px;">
<p style="font-size:15px;font-weight:600;margin:0 0 12px;">Agreement link sent to ${escHtml(contactName)} (${escHtml(contactEmail)})</p>
<table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;width:100%;">
  <tr><td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Deal:</strong> ${escHtml(dealTitle)}</td></tr>
  <tr><td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>System:</strong> ${systemLabel}</td></tr>
  <tr><td style="padding:16px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Setup:</strong> $${setupFee ?? 0}</td></tr>
  <tr><td style="padding:16px 20px;font-size:13px;"><strong>Monthly:</strong> $${monthlyRetainer ?? 0}/mo</td></tr>
</table>
<p style="font-size:13px;color:#6b7280;margin:12px 0 0;">Agreement URL: ${escHtml(agreementUrl) ?? "not set in workspace settings"}</p>
</div>`
    );

    return { ok: true, contactEmail };
  },
});

// ── Agreement Signed → Kick Off Onboarding ─────────────────────────────────
export const agreementSignedOnboarding = task({
  id: "agreement-signed-onboarding",
  run: async (payload: DealPayload & { agreementSignedAt?: string }) => {
    const [ws] = await db.select().from(workspaceSettings).limit(1);
    const { contactEmail, contactName, dealTitle, systemType, setupFee, monthlyRetainer } = payload;
    const internalEmail = ws?.internalEmail ?? process.env.INTERNAL_ALERT_EMAIL ?? "michael@revenuecs.com";
    const intakeFormUrl = ws?.intakeFormUrl;
    const firstName = escHtml(contactName?.split(" ")[0] ?? "there");
    const systemLabel = escHtml(systemType ? systemTypeLabel[systemType] ?? systemType : "Revenue System");

    // 1. Send intake form to new client
    if (contactEmail && intakeFormUrl) {
      await sendEmail(
        contactEmail,
        `Welcome to RevenueCS — here's your next step, ${escHtml(contactName?.split(" ")[0] ?? "there")}`,
        `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0a0a0a 0%,#111f0d 100%);padding:36px 48px 32px;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#a8ff47;text-transform:uppercase;">You're officially in. 🎉</p>
    <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;">Let's build your ${systemLabel}, ${firstName}.</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 48px 28px;">
    <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.65;">
      Agreement signed — you're a RevenueCS client. We're already looking forward to your launch.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65;">
      Before we can start building, we need about 5 minutes of your time. The intake form below gives us everything we need to configure your system exactly to your business.
    </p>

    <!-- What to expect -->
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#166534;text-transform:uppercase;">What happens next</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:13px;color:#374151;padding-bottom:10px;vertical-align:top;">
            <span style="font-weight:700;color:#16a34a;">1 &nbsp;</span> Complete the 5-min intake form below
          </td></tr>
          <tr><td style="font-size:13px;color:#374151;padding-bottom:10px;vertical-align:top;">
            <span style="font-weight:700;color:#16a34a;">2 &nbsp;</span> We schedule your kickoff call (usually within 48 hrs)
          </td></tr>
          <tr><td style="font-size:13px;color:#374151;padding-bottom:10px;vertical-align:top;">
            <span style="font-weight:700;color:#16a34a;">3 &nbsp;</span> Build begins — your system is live within 7–14 days
          </td></tr>
          <tr><td style="font-size:13px;color:#374151;vertical-align:top;">
            <span style="font-weight:700;color:#16a34a;">4 &nbsp;</span> First revenue captured. We track everything in your ROI dashboard
          </td></tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0">
      <tr><td style="border-radius:10px;background:#a8ff47;">
        <a href="${escHtml(intakeFormUrl)}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;letter-spacing:-0.01em;">
          Complete Intake Form — 5 min →
        </a>
      </td></tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
      The sooner this is done, the sooner we're building. If anything comes up, just reply to this email.
    </p>
  </td></tr>

  <!-- Investment reminder -->
  <tr><td style="background:#f9fafb;padding:20px 48px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Setup: $${setupFee ?? 0} &nbsp;·&nbsp; Monthly: $${monthlyRetainer ?? 0}/mo &nbsp;·&nbsp; RevenueCS
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
      );
    }

    // 2. Internal alert
    await sendEmail(
      internalEmail,
      `🎉 SIGNED — ${escHtml(contactName ?? contactEmail ?? "unknown")} is a client`,
      `<div style="font-family:-apple-system,sans-serif;max-width:480px;">
<p style="font-size:18px;font-weight:700;margin:0 0 4px;">New client locked in 🔒</p>
<p style="font-size:14px;color:#6b7280;margin:0 0 20px;">${escHtml(contactName)} (${escHtml(contactEmail)})</p>
<table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;width:100%;">
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Deal:</strong> ${escHtml(dealTitle)}</td></tr>
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>System:</strong> ${systemLabel}</td></tr>
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Setup:</strong> $${setupFee ?? 0}</td></tr>
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Monthly:</strong> $${monthlyRetainer ?? 0}/mo</td></tr>
  <tr><td style="padding:14px 20px;font-size:13px;"><strong>Signed at:</strong> ${payload.agreementSignedAt ?? new Date().toISOString()}</td></tr>
</table>
<p style="font-size:13px;color:#374151;margin:16px 0 0;font-weight:600;">🎯 Action: Intake form sent. Book kickoff within 48 hrs.</p>
</div>`
    );

    return { ok: true, contactEmail };
  },
});

// ── Demo Booked → Internal Alert ───────────────────────────────────────────
export const demoBookedAlert = task({
  id: "demo-booked-alert",
  run: async (payload: {
    dealId: string;
    dealTitle: string;
    contactEmail: string | null;
    contactName: string | null;
    demoBookedAt: string;
  }) => {
    const [ws] = await db.select().from(workspaceSettings).limit(1);
    const internalEmail = ws?.internalEmail ?? process.env.INTERNAL_ALERT_EMAIL ?? "michael@revenuecs.com";
    const { contactEmail, contactName, dealTitle, demoBookedAt } = payload;

    await sendEmail(
      internalEmail,
      `📅 Demo booked — ${escHtml(contactName ?? contactEmail ?? "unknown")}`,
      `<div style="font-family:-apple-system,sans-serif;max-width:480px;">
<p style="font-size:16px;font-weight:600;margin:0 0 16px;">New demo on the calendar 📅</p>
<table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;width:100%;">
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Contact:</strong> ${escHtml(contactName)} (${escHtml(contactEmail)})</td></tr>
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Deal:</strong> ${escHtml(dealTitle)}</td></tr>
  <tr><td style="padding:14px 20px;font-size:13px;"><strong>Booked at:</strong> ${escHtml(demoBookedAt)}</td></tr>
</table>
<p style="font-size:13px;color:#374151;margin:16px 0 0;font-weight:600;">🎯 Prep: Research the business, confirm Cal.com event, have pricing ready.</p>
</div>`
    );

    return { ok: true };
  },
});
