import { Link } from "react-router";
import { Calendar, FileCheck, Users2, TrendingUp, ArrowUpRight, DollarSign } from "lucide-react";

interface RecentDeal {
  id: string;
  title: string;
  stage: string;
  systemType: string | null;
  value: number;
  agreementSignedAt: string | Date | null;
}

interface RecentActivity {
  id: string;
  title: string;
  type: string;
  createdAt: string | Date;
}

interface Stats {
  demosBooked: number;
  demosDone: number;
  agreementsSigned: number;
  clientsLive: number;
  mrr: number;
  pipelineValue: number;
  recentDeals: RecentDeal[];
  recentActivities: RecentActivity[];
}

const stageLabel: Record<string, string> = {
  cold_outreach: "Cold Outreach", demo_booked: "Demo Booked", demo_done: "Demo Done",
  proposal_sent: "Proposal Sent", agreement_signed: "Agreement Signed", onboarding: "Onboarding",
  live: "Live", upsell: "Upsell", lost: "Lost",
};

const stageColor: Record<string, string> = {
  cold_outreach: "#818cf8", demo_booked: "#06b6d4", demo_done: "#a78bfa",
  proposal_sent: "#f59e0b", agreement_signed: "#10b981", onboarding: "#22c55e",
  live: "#4ade80", upsell: "#f97316", lost: "#ef4444",
};

const activityIcon: Record<string, string> = {
  note: "📝", call: "📞", email: "✉️", meeting: "🤝", task: "✓", demo: "🎯", follow_up: "🔄",
};

export default function DashboardClient({ firstName, stats, greeting }: { firstName: string; stats: Stats; greeting: string }) {
  const kpis = [
    { label: "Demos Booked",       sublabel: "this week",     value: stats.demosBooked.toString(),        icon: Calendar,   color: "#06b6d4", glow: "rgba(6,182,212,0.3)",   bg: "rgba(6,182,212,0.12)" },
    { label: "Agreements Signed",  sublabel: "this month",    value: stats.agreementsSigned.toString(),   icon: FileCheck,  color: "#10b981", glow: "rgba(16,185,129,0.3)",  bg: "rgba(16,185,129,0.12)" },
    { label: "Clients Live",       sublabel: "total active",  value: stats.clientsLive.toString(),        icon: Users2,     color: "#4ade80", glow: "rgba(74,222,128,0.3)",  bg: "rgba(74,222,128,0.12)" },
    { label: "MRR",                sublabel: "from live clients", value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, color: "#a78bfa", glow: "rgba(139,92,246,0.3)",  bg: "rgba(139,92,246,0.12)" },
  ];

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", letterSpacing: "-0.04em", marginBottom: 6 }}>
          Good {greeting}, {firstName}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>
          RevenueCaptureSystem · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {kpis.map(({ label, sublabel, value, icon: Icon, color, glow, bg }) => (
          <div key={label} className="glass" style={{ padding: "20px 20px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: "rgba(255,255,255,0.45)", display: "block" }}>{label}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{sublabel}</span>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 12px ${glow}`, border: `1px solid ${color}30` }}>
                <Icon size={14} color={color} strokeWidth={2} />
              </div>
            </div>
            <p style={{ fontSize: 32, fontWeight: 700, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {stats.pipelineValue > 0 && (
        <div className="glass-sm" style={{ padding: "12px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} color="#818cf8" />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Total pipeline value (excl. lost)</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#818cf8" }}>${stats.pipelineValue.toLocaleString()}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="glass" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 13.5, fontWeight: 600, color: "white" }}>Active Pipeline</h2>
            <Link href="/deals" prefetch style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "rgba(99,102,241,0.85)", textDecoration: "none", fontWeight: 500 }}>
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          {stats.recentDeals.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No deals yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {stats.recentDeals.map((deal) => (
                <Link key={deal.id} href="/deals" prefetch style={{ textDecoration: "none" }}>
                  <div className="row-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "white", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 500, color: stageColor[deal.stage] ?? "#fff" }}>{stageLabel[deal.stage] ?? deal.stage}</span>
                        {deal.agreementSignedAt && <span style={{ fontSize: 10, color: "#4ade80" }}>· Signed</span>}
                      </div>
                    </div>
                    {deal.value > 0 && (
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: stageColor[deal.stage] ?? "white", flexShrink: 0, marginLeft: 8 }}>
                        ${deal.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="glass" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 13.5, fontWeight: 600, color: "white" }}>Recent Activity</h2>
            <Link href="/activity" prefetch style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "rgba(99,102,241,0.85)", textDecoration: "none", fontWeight: 500 }}>
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          {stats.recentActivities.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No activity yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {stats.recentActivities.map((act) => (
                <div key={act.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 13, lineHeight: 1, marginTop: 1 }}>{activityIcon[act.type] ?? "💬"}</span>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: "white", marginBottom: 1 }}>{act.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {new Date(act.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
