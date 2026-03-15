
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const PLAYS = [
  {
    id: "A",
    title: "Play A — Cold Outreach (Reactivation)",
    color: "#818cf8",
    gradient: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))",
    border: "rgba(99,102,241,0.3)",
    system: "Reactivation System",
    goal: "Book demos from dormant/cold prospect lists using AI voice.",
    steps: [
      { step: "1", title: "Identify list", desc: "Pull 200–500 contacts from existing database or purchased list. Verify phone numbers are mobile." },
      { step: "2", title: "Set up VAPI reactivation assistant", desc: "Configure the AI with the client's business name, offer, and objection handling. Test 5 calls internally first." },
      { step: "3", title: "Compliance check", desc: "Confirm TCPA compliance — written consent or prior business relationship. Document in client record." },
      { step: "4", title: "Soft launch (50 calls)", desc: "Run first batch of 50 calls. Review recordings for tone, objections, and conversion. Adjust script." },
      { step: "5", title: "Full launch", desc: "Scale to full list. Monitor daily: call connected rate, demo book rate, no-show rate." },
      { step: "6", title: "Reporting", desc: "Weekly ROI report to client via the ROI terminal dashboard. Target: 8–15% demo book rate." },
    ],
    kpis: ["Call connect rate: >30%", "Demo book rate: 8–15%", "No-show rate: <25%"],
    makeWebhook: "Fires on lead status → demo_scheduled",
  },
  {
    id: "B",
    title: "Play B — Hot Lead / Inbound",
    color: "#ef4444",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(249,115,22,0.1))",
    border: "rgba(239,68,68,0.3)",
    system: "Hot Lead System",
    goal: "Instantly follow up with inbound leads before they go cold.",
    steps: [
      { step: "1", title: "Lead comes in", desc: "Webhook from landing page / CRM / ad platform fires to Make.com. Lead is created in CaptureOS automatically." },
      { step: "2", title: "AI calls within 60 seconds", desc: "VAPI assistant dials the lead immediately with personalized intro based on their opt-in form data." },
      { step: "3", title: "Qualify + book", desc: "AI qualifies (budget, decision maker, timeline) and books them directly into the client's calendar." },
      { step: "4", title: "SMS follow-up", desc: "If no answer, automated SMS sequence (Day 0, Day 1, Day 3) from Twilio. AI calls again on day 1." },
      { step: "5", title: "Rep handoff", desc: "Qualified and booked leads are flagged in CaptureOS. Sales rep takes demo call." },
    ],
    kpis: ["Speed to call: <90 seconds", "Contact rate: >60%", "Qualified rate: 30–50%"],
    makeWebhook: "Fires on new inbound lead webhook",
  },
  {
    id: "C",
    title: "Play C — Demo to Proposal",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.1))",
    border: "rgba(245,158,11,0.3)",
    system: "All systems",
    goal: "Convert demo-done prospects into signed agreements.",
    steps: [
      { step: "1", title: "Post-demo same-day follow-up", desc: "Send personalized Loom + proposal within 2 hours of demo. Use agreement template from workspace settings." },
      { step: "2", title: "Mark Demo Done in pipeline", desc: "Update deal stage to Demo Done in CaptureOS. System auto-stamps the date." },
      { step: "3", title: "Proposal sent", desc: "Send agreement via DocuSign or PandaDoc. Mark Agreement Sent date in deal record." },
      { step: "4", title: "Follow-up sequence", desc: "Day 1: quick voice note. Day 3: check-in call. Day 7: final nudge with scarcity." },
      { step: "5", title: "Close", desc: "When agreement signed, update stage to Agreement Signed. Make webhook auto-fires to trigger onboarding flow." },
    ],
    kpis: ["Demo → proposal rate: >80%", "Proposal → close rate: 30–50%", "Time to close: <7 days"],
    makeWebhook: "Auto-fires on stage → agreement_signed",
  },
  {
    id: "D",
    title: "Play D — Onboarding",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))",
    border: "rgba(34,197,94,0.3)",
    system: "All systems",
    goal: "Get the client set up, compliant, built, and live within 2 weeks.",
    steps: [
      { step: "1", title: "Send intake form", desc: "Google Form with business info, target audience, scripts, and legal consent. Mark Intake Form Sent in CaptureOS." },
      { step: "2", title: "Compliance review", desc: "Review TCPA consent docs, calling times, DNC compliance. Mark Compliance Reviewed + Approved." },
      { step: "3", title: "Set up accounts", desc: "Create Twilio sub-account, VAPI assistant, Make scenario. Log SIDs in client record." },
      { step: "4", title: "Kickoff call", desc: "30-min call with client to confirm script, offer, and launch date. Mark Kickoff Done." },
      { step: "5", title: "Build + test", desc: "Build the full VAPI flow, test 10 internal calls, record sample conversations. Mark Build Complete + Testing Complete." },
      { step: "6", title: "Soft launch", desc: "Run 25–50 live calls. Review with client. Adjust. Mark Soft Launch Done." },
      { step: "7", title: "Go live", desc: "Full launch. Set Go-Live Date in CaptureOS. Update onboarding status to Live." },
    ],
    kpis: ["Intake to live: <14 days", "Test call quality score: 8+/10", "Client approval before launch: required"],
    makeWebhook: "Fires on onboarding_status → live",
  },
  {
    id: "E",
    title: "Play E — Active Client Management",
    color: "#4ade80",
    gradient: "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.1))",
    border: "rgba(74,222,128,0.3)",
    system: "All systems (live clients)",
    goal: "Keep clients happy, results strong, and retention high.",
    steps: [
      { step: "1", title: "Weekly ROI reports", desc: "Send clients the ROI terminal dashboard link every Monday. Include: calls made, demos booked, revenue attributed." },
      { step: "2", title: "Monthly check-in", desc: "30-min call to review results, troubleshoot, and re-confirm compliance. Log as activity in CaptureOS." },
      { step: "3", title: "Script optimization", desc: "A/B test scripts monthly. Keep highest-performing version live." },
      { step: "4", title: "Expansion conversations", desc: "After 60 days live with good results, introduce upsell conversation (Combo, additional system, new market)." },
      { step: "5", title: "Billing", desc: "Track next billing date in CaptureOS. Confirm payment on time. Escalate if late." },
    ],
    kpis: ["Client retention: >90%", "Monthly ROI report sent: 100%", "Upsell conversation by day 60: 100%"],
    makeWebhook: "N/A",
  },
  {
    id: "F",
    title: "Play F — Upsell / Expansion",
    color: "#f97316",
    gradient: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(245,158,11,0.1))",
    border: "rgba(249,115,22,0.3)",
    system: "Combo / add-on",
    goal: "Increase client MRR by expanding scope or adding systems.",
    steps: [
      { step: "1", title: "Identify upsell trigger", desc: "Client has good results (>8% demo rate), asks about new markets, or demo volume has dropped and a second system would help." },
      { step: "2", title: "Upsell proposal", desc: "Propose add-on: Backend system, second location, new lead list, or full Combo upgrade. Price accordingly." },
      { step: "3", title: "New agreement", desc: "Send updated agreement with revised retainer. Mark new Agreement Sent date." },
      { step: "4", title: "Expand build", desc: "Add new VAPI assistant or expand Make scenario. Rerun compliance + testing." },
      { step: "5", title: "Update CaptureOS", desc: "Update system type to Combo, update monthly retainer, set new billing date." },
    ],
    kpis: ["Upsell close rate: >40%", "MRR expansion per upsell: $500–2,000+"],
    makeWebhook: "Fires on agreement_signed (new upsell deal)",
  },
];

export default function PlaybookPage() {
  const [openPlay, setOpenPlay] = useState<string | null>("A");

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Playbook</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>
          RevenueCaptureSystem.com — Standard Operating Plays
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PLAYS.map((play) => {
          const isOpen = openPlay === play.id;
          return (
            <div key={play.id} className="glass" style={{ overflow: "hidden", border: isOpen ? `1px solid ${play.border}` : undefined }}>
              {/* Header */}
              <button
                onClick={() => setOpenPlay(isOpen ? null : play.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: play.gradient, border: `1px solid ${play.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: play.color }}>
                      {play.id}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>{play.title}</p>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{play.system}</p>
                  </div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {/* Content */}
              {isOpen && (
                <div style={{ padding: "0 22px 22px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", paddingTop: 16, marginBottom: 20, lineHeight: 1.6 }}>
                    {play.goal}
                  </p>

                  {/* Steps */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 20, position: "relative" }}>
                    {play.steps.map((s, i) => (
                      <div key={s.step} style={{ display: "flex", gap: 14, paddingBottom: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: play.gradient, border: `1px solid ${play.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: play.color }}>
                            {s.step}
                          </div>
                          {i < play.steps.length - 1 && (
                            <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.07)", marginTop: 4, marginBottom: -4 }} />
                          )}
                        </div>
                        <div style={{ paddingTop: 4 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "white", marginBottom: 3 }}>{s.title}</p>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* KPIs + Webhook */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Target KPIs</p>
                      {play.kpis.map((kpi) => (
                        <p key={kpi} style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>· {kpi}</p>
                      ))}
                    </div>
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", minWidth: 200 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(99,102,241,0.6)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Make.com Webhook</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{play.makeWebhook}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
