import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, deals, contacts, activities } from "@/drizzle/schema";
import { count, eq, sql } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, Zap, DollarSign, ArrowUpRight } from "lucide-react";

async function getDashboardStats() {
  const [totalContacts] = await db.select({ count: count() }).from(contacts);
  const [totalLeads] = await db.select({ count: count() }).from(leads);
  const [openDeals] = await db
    .select({ count: count() })
    .from(deals)
    .where(sql`${deals.stage} NOT IN ('closed_won', 'closed_lost')`);
  const [dealValue] = await db
    .select({ total: sql<number>`COALESCE(SUM(${deals.value}), 0)` })
    .from(deals)
    .where(eq(deals.stage, "closed_won"));

  const recentActivities = await db
    .select()
    .from(activities)
    .orderBy(sql`${activities.createdAt} DESC`)
    .limit(8);

  const recentLeads = await db
    .select()
    .from(leads)
    .orderBy(sql`${leads.createdAt} DESC`)
    .limit(5);

  return {
    totalContacts: totalContacts.count,
    totalLeads: totalLeads.count,
    openDeals: openDeals.count,
    wonRevenue: dealValue.total ?? 0,
    recentActivities,
    recentLeads,
  };
}

const statusColors: Record<string, string> = {
  new: "pill-new",
  contacted: "pill-contacted",
  qualified: "pill-qualified",
  proposal: "pill-proposal",
  negotiation: "pill-negotiation",
  closed_won: "pill-won",
  closed_lost: "pill-lost",
};

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  const kpis = [
    {
      label: "Total Contacts",
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.12)",
    },
    {
      label: "Active Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: Zap,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
    },
    {
      label: "Open Deals",
      value: stats.openDeals.toLocaleString(),
      icon: TrendingUp,
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.12)",
    },
    {
      label: "Won Revenue",
      value: formatCurrency(stats.wonRevenue),
      icon: DollarSign,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
    },
  ];

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}
        >
          Good {getTimeOfDay()}, {firstName} 👋
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          Here&apos;s what&apos;s happening with your pipeline today.
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="glass"
            style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                {label}
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={15} color={color} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Leads */}
        <div className="glass" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Recent Leads</h2>
            <a
              href="/leads"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "rgba(99,102,241,0.9)",
                textDecoration: "none",
              }}
            >
              View all <ArrowUpRight size={12} />
            </a>
          </div>

          {stats.recentLeads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
              No leads yet. Add your first lead.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stats.recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "white", marginBottom: 2 }}>
                      {lead.title}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      {lead.source ?? "Direct"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {lead.value ? (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        {formatCurrency(lead.value)}
                      </span>
                    ) : null}
                    <span className={`pill ${statusColors[lead.status] ?? "pill-new"}`}>
                      {lead.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Recent Activity</h2>
            <a
              href="/activity"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "rgba(99,102,241,0.9)",
                textDecoration: "none",
              }}
            >
              View all <ArrowUpRight size={12} />
            </a>
          </div>

          {stats.recentActivities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
              No activity yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.recentActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "rgba(99,102,241,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {activityEmoji(act.type)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "white", marginBottom: 1 }}>
                      {act.title}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      {new Date(act.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function activityEmoji(type: string) {
  const map: Record<string, string> = {
    note: "📝",
    call: "📞",
    email: "✉️",
    meeting: "🤝",
    task: "✅",
  };
  return map[type] ?? "💬";
}
