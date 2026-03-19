import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { workspaceSettings } from "@/drizzle/schema";

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "CaptureOS <noreply@captureos.app>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${text}`);
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

// ── Demo Done → Send Agreement Link ────────────────────────────────────────
export const demoDoneAgreementSender = task({
  id: "demo-done-agreement-sender",
  run: async (payload: DealPayload) => {
    const [ws] = await db.select().from(workspaceSettings).limit(1);
    const { contactEmail, contactName, dealTitle, systemType, setupFee, monthlyRetainer } = payload;
    const internalEmail = ws?.internalEmail ?? process.env.INTERNAL_ALERT_EMAIL ?? "michael@revenuecs.com";
    const agreementUrl = ws?.agreementTemplateUrl;
    const firstName = contactName?.split(" ")[0] ?? "there";

    // 1. Send agreement link to prospect
    if (contactEmail && agreementUrl) {
      await sendEmail(
        contactEmail,
        `Your agreement is ready — ${dealTitle}`,
        `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0f0f0f;padding:28px 40px;">
    <p style="color:#a8ff47;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">Agreement Ready</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Hi ${firstName},</h1>
  </div>
  <div style="padding:32px 40px;">
    <p style="font-size:15px;color:#374151;line-height:1.6;">Your agreement for <strong>${dealTitle}</strong> is ready to review and sign.</p>
    <table style="background:#f9fafb;border-radius:8px;width:100%;margin:16px 0;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:16px 20px;font-size:13px;color:#6b7280;">
        <strong style="color:#111827;">System:</strong> ${systemType ?? "TBD"} &nbsp;·&nbsp;
        <strong style="color:#111827;">Setup:</strong> $${setupFee ?? 0} &nbsp;·&nbsp;
        <strong style="color:#111827;">Monthly:</strong> $${monthlyRetainer ?? 0}/mo
      </td></tr>
    </table>
    <a href="${agreementUrl}" style="display:inline-block;margin-top:8px;background:#6366f1;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Review &amp; Sign Agreement →</a>
    <p style="margin-top:28px;font-size:12px;color:#9ca3af;">Questions? Reply to this email or reach us at michael@revenuecs.com</p>
  </div>
</div></body></html>`
      );
    }

    // 2. Internal alert
    await sendEmail(
      internalEmail,
      `✅ Demo done — agreement sent to ${contactName ?? contactEmail ?? "unknown"}`,
      `<p style="font-family:sans-serif;"><strong>Deal:</strong> ${dealTitle}<br><strong>Contact:</strong> ${contactName} (${contactEmail})<br><strong>System:</strong> ${systemType} | Setup: $${setupFee} | Monthly: $${monthlyRetainer}/mo<br><strong>Agreement URL:</strong> ${agreementUrl ?? "not set"}</p>`
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
    const firstName = contactName?.split(" ")[0] ?? "there";

    // 1. Send intake form to client
    if (contactEmail && intakeFormUrl) {
      await sendEmail(
        contactEmail,
        `Welcome! Next step: complete your onboarding intake`,
        `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0d1a0d;padding:28px 40px;">
    <p style="color:#a8ff47;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">Welcome to RevenueCS 🎉</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">Let's get you launched, ${firstName}!</h1>
  </div>
  <div style="padding:32px 40px;">
    <p style="font-size:15px;color:#374151;line-height:1.6;">Your agreement is signed — you're officially a RevenueCS client. To start building your <strong>${systemType ?? "system"}</strong>, please complete the short intake form below.</p>
    <p style="font-size:14px;color:#6b7280;">Takes ~5 minutes. This gives us everything needed to kick off your build.</p>
    <a href="${intakeFormUrl}" style="display:inline-block;margin-top:20px;background:#a8ff47;color:#0d1a0d;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">Complete Intake Form →</a>
    <p style="margin-top:28px;font-size:12px;color:#9ca3af;">Setup fee: $${setupFee ?? 0} | Monthly retainer: $${monthlyRetainer ?? 0}/mo</p>
  </div>
</div></body></html>`
      );
    }

    // 2. Internal alert
    await sendEmail(
      internalEmail,
      `🎉 Agreement signed — onboarding started for ${contactName ?? contactEmail ?? "unknown"}`,
      `<p style="font-family:sans-serif;"><strong>Deal:</strong> ${dealTitle}<br><strong>Contact:</strong> ${contactName} (${contactEmail})<br><strong>System:</strong> ${systemType} | Setup: $${setupFee} | Monthly: $${monthlyRetainer}/mo<br><strong>Intake form:</strong> ${intakeFormUrl ?? "not set"}<br><strong>Signed at:</strong> ${payload.agreementSignedAt ?? new Date().toISOString()}</p>`
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
      `📅 Demo booked — ${contactName ?? contactEmail ?? "unknown"}`,
      `<p style="font-family:sans-serif;"><strong>Deal:</strong> ${dealTitle}<br><strong>Contact:</strong> ${contactName} (${contactEmail})<br><strong>Booked at:</strong> ${demoBookedAt}</p>`
    );

    return { ok: true };
  },
});
