import { task, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { clients, workspaceSettings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { escHtml } from "@/lib/html";

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Michael @ RevenueCS <michael@revenuecs.com>",
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

const systemTypeLabel: Record<string, string> = {
  reactivation: "Reactivation System",
  hot_lead: "Hot Lead System",
  backend: "Backend Nurture System",
  combo: "Full Revenue Stack",
};

// ── Client Go-Live → Celebration + ROI Email ──────────────────────────────
export const clientGoLive = task({
  id: "client-go-live",
  run: async (payload: {
    clientId: string;
    businessName: string;
    email: string | null;
    systemType: string | null;
    roiDashboardUrl: string | null;
    monthlyRetainer: number | null;
    goLiveDate: string;
  }) => {
    const [ws] = await db.select().from(workspaceSettings).limit(1);
    const { businessName, email, systemType, roiDashboardUrl, monthlyRetainer, goLiveDate } = payload;
    const internalEmail = ws?.internalEmail ?? process.env.INTERNAL_ALERT_EMAIL ?? "michael@revenuecs.com";
    const systemLabel = escHtml(systemType ? systemTypeLabel[systemType] ?? systemType : "Revenue System");
    const safeName = escHtml(businessName);

    // 1. Go-live celebration email to client
    if (email) {
      await sendEmail(
        email,
        `You're live — your ${escHtml(systemType ? systemTypeLabel[systemType] ?? systemType : "Revenue System")} is active`,
        `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0f0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0f1a0f;border-radius:16px;overflow:hidden;border:1px solid rgba(168,255,71,0.2);box-shadow:0 8px 40px rgba(0,0,0,0.4);">

  <!-- Header -->
  <tr><td style="padding:44px 48px 36px;text-align:center;">
    <div style="display:inline-block;background:rgba(168,255,71,0.12);border:1px solid rgba(168,255,71,0.25);border-radius:50px;padding:8px 20px;margin-bottom:20px;">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:#a8ff47;text-transform:uppercase;">System Active</span>
    </div>
    <h1 style="margin:0 0 10px;font-size:30px;font-weight:700;color:#ffffff;line-height:1.2;">${safeName} is live.</h1>
    <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.5);">Your ${systemLabel} is running and capturing revenue.</p>
  </td></tr>

  <!-- Dashboard CTA -->
  <tr><td style="background:rgba(168,255,71,0.06);border-top:1px solid rgba(168,255,71,0.12);border-bottom:1px solid rgba(168,255,71,0.12);padding:32px 48px;text-align:center;">
    <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Track every call, lead, and dollar your system generates — all in one place.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);">
      Your ROI dashboard updates in real time.
    </p>
    ${roiDashboardUrl
      ? `<table cellpadding="0" cellspacing="0" align="center">
          <tr><td style="border-radius:10px;background:#a8ff47;">
            <a href="${escHtml(roiDashboardUrl)}" style="display:inline-block;padding:15px 40px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;">
              Open Your Dashboard →
            </a>
          </td></tr>
        </table>`
      : `<p style="font-size:13px;color:rgba(255,255,255,0.3);">Dashboard link coming shortly — we'll send it your way.</p>`
    }
  </td></tr>

  <!-- What to expect -->
  <tr><td style="padding:32px 48px;">
    <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:0.08em;color:rgba(255,255,255,0.3);text-transform:uppercase;">What to Expect</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:24px;vertical-align:top;padding-bottom:14px;">
          <div style="width:20px;height:20px;border-radius:50%;background:rgba(168,255,71,0.15);border:1px solid rgba(168,255,71,0.3);text-align:center;line-height:20px;font-size:10px;font-weight:700;color:#a8ff47;">1</div>
        </td>
        <td style="padding-left:12px;font-size:14px;color:rgba(255,255,255,0.7);padding-bottom:14px;vertical-align:top;line-height:1.5;">
          <strong style="color:#fff;">First 48 hours</strong> — your system begins outreach. Initial contacts will start coming in.
        </td>
      </tr>
      <tr>
        <td style="width:24px;vertical-align:top;padding-bottom:14px;">
          <div style="width:20px;height:20px;border-radius:50%;background:rgba(168,255,71,0.15);border:1px solid rgba(168,255,71,0.3);text-align:center;line-height:20px;font-size:10px;font-weight:700;color:#a8ff47;">2</div>
        </td>
        <td style="padding-left:12px;font-size:14px;color:rgba(255,255,255,0.7);padding-bottom:14px;vertical-align:top;line-height:1.5;">
          <strong style="color:#fff;">Week 1 check-in</strong> — we review performance together and fine-tune anything needed.
        </td>
      </tr>
      <tr>
        <td style="width:24px;vertical-align:top;">
          <div style="width:20px;height:20px;border-radius:50%;background:rgba(168,255,71,0.15);border:1px solid rgba(168,255,71,0.3);text-align:center;line-height:20px;font-size:10px;font-weight:700;color:#a8ff47;">3</div>
        </td>
        <td style="padding-left:12px;font-size:14px;color:rgba(255,255,255,0.7);vertical-align:top;line-height:1.5;">
          <strong style="color:#fff;">Every Monday</strong> — weekly performance report lands in your inbox automatically.
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:20px 48px;">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">
      Go-live: ${escHtml(goLiveDate)} &nbsp;·&nbsp; $${monthlyRetainer ?? 0}/mo &nbsp;·&nbsp; Reply anytime with questions
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
      `🚀 LIVE — ${safeName}`,
      `<div style="font-family:-apple-system,sans-serif;max-width:480px;">
<p style="font-size:18px;font-weight:700;margin:0 0 4px;">Client is live 🚀</p>
<p style="font-size:14px;color:#6b7280;margin:0 0 20px;">${safeName}</p>
<table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;width:100%;">
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Email:</strong> ${escHtml(email) ?? "—"}</td></tr>
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>System:</strong> ${systemLabel}</td></tr>
  <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;font-size:13px;"><strong>Retainer:</strong> $${monthlyRetainer ?? 0}/mo</td></tr>
  <tr><td style="padding:14px 20px;font-size:13px;"><strong>Dashboard:</strong> ${escHtml(roiDashboardUrl) ?? "not set"}</td></tr>
</table>
<p style="font-size:13px;color:#374151;margin:16px 0 0;font-weight:600;">🎯 Schedule week 1 check-in call.</p>
</div>`
    );

    return { ok: true, businessName };
  },
});

// ── Weekly ROI Emails — Every Monday 9 AM CST (15:00 UTC) ─────────────────
export const weeklyRoiEmails = schedules.task({
  id: "weekly-roi-emails",
  cron: "0 15 * * 1",
  run: async () => {
    const liveClients = await db
      .select()
      .from(clients)
      .where(eq(clients.onboardingStatus, "live"));

    const sent: string[] = [];
    const failed: string[] = [];

    for (const client of liveClients) {
      if (!client.email) continue;
      const safeName = escHtml(client.businessName);
      try {
        await sendEmail(
          client.email,
          `Weekly performance report — ${escHtml(client.businessName)}`,
          `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0f0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#0f1a0f;border-radius:14px;overflow:hidden;border:1px solid rgba(168,255,71,0.15);">

  <!-- Header -->
  <tr><td style="padding:28px 36px 24px;">
    <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.12em;color:rgba(168,255,71,0.7);text-transform:uppercase;">Weekly Report · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${safeName}</h1>
  </td></tr>

  <!-- Message -->
  <tr><td style="background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);padding:24px 36px;">
    <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.65;">
      Your system has been running another week. Head to your dashboard to see calls handled, leads captured, and revenue in motion.
    </p>
    ${client.roiDashboardUrl
      ? `<table cellpadding="0" cellspacing="0">
          <tr><td style="border-radius:8px;background:#a8ff47;">
            <a href="${escHtml(client.roiDashboardUrl)}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#0a0a0a;text-decoration:none;">
              View This Week's Performance →
            </a>
          </td></tr>
        </table>`
      : ""
    }
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:16px 36px;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">$${client.monthlyRetainer ?? 0}/mo · RevenueCS · Reply anytime</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
        );
        sent.push(client.businessName);
      } catch (err) {
        console.error(`[weekly-roi] Failed for ${client.businessName}:`, err);
        failed.push(client.businessName);
      }
    }

    return { sent: sent.length, failed: failed.length, clients: sent };
  },
});
