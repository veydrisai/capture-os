import { task, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { clients, workspaceSettings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

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

    // 1. Celebration email to client
    if (email) {
      await sendEmail(
        email,
        `🚀 You're live! Welcome to RevenueCS`,
        `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1a0d;margin:0;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#111f11;border-radius:16px;overflow:hidden;border:1px solid rgba(168,255,71,0.15);">
  <div style="padding:36px 40px;text-align:center;">
    <p style="color:#a8ff47;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">You're Live 🎉</p>
    <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 8px;">${businessName}</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0;">Your ${systemType ?? "revenue system"} is now active</p>
  </div>
  <div style="background:rgba(168,255,71,0.05);border-top:1px solid rgba(168,255,71,0.1);border-bottom:1px solid rgba(168,255,71,0.1);padding:24px 40px;text-align:center;">
    <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 20px;">Track your revenue capture performance in real time:</p>
    ${roiDashboardUrl
      ? `<a href="${roiDashboardUrl}" style="display:inline-block;background:#a8ff47;color:#0d1a0d;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">View Your ROI Dashboard →</a>`
      : `<p style="color:rgba(255,255,255,0.4);font-size:13px;">Your dashboard will be shared shortly.</p>`
    }
  </div>
  <div style="padding:24px 40px;">
    <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;margin:0;">Go-live: ${goLiveDate} · Monthly retainer: $${monthlyRetainer ?? 0}/mo</p>
  </div>
</div></body></html>`
      );
    }

    // 2. Internal alert
    await sendEmail(
      internalEmail,
      `🚀 Client LIVE — ${businessName}`,
      `<p style="font-family:sans-serif;"><strong>${businessName}</strong> is now live!<br>Email: ${email ?? "—"}<br>System: ${systemType ?? "—"}<br>Retainer: $${monthlyRetainer ?? 0}/mo<br>ROI Dashboard: ${roiDashboardUrl ?? "not set"}<br>Go-live: ${goLiveDate}</p>`
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
      try {
        await sendEmail(
          client.email,
          `📊 Your weekly revenue capture report — ${client.businessName}`,
          `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1a0d;margin:0;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#111f11;border-radius:16px;overflow:hidden;border:1px solid rgba(168,255,71,0.15);">
  <div style="padding:28px 40px;">
    <p style="color:#a8ff47;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">Weekly Report</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0;">${client.businessName}</h1>
  </div>
  <div style="background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.06);padding:24px 40px;">
    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin:0 0 20px;">Here's your weekly revenue capture performance summary. Check your dashboard for full details.</p>
    ${client.roiDashboardUrl
      ? `<a href="${client.roiDashboardUrl}" style="display:inline-block;background:#a8ff47;color:#0d1a0d;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;">View Full Dashboard →</a>`
      : ""
    }
  </div>
  <div style="padding:16px 40px;">
    <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">Monthly retainer: $${client.monthlyRetainer ?? 0}/mo · RevenueCS</p>
  </div>
</div></body></html>`
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
