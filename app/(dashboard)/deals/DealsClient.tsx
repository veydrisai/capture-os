"use client";

import { useState } from "react";
import { Plus, Search, Columns, List, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import DealModal from "@/components/crm/DealModal";

interface Deal {
  id: string;
  title: string;
  stage: string;
  systemType: string | null;
  value: number;
  setupFee: number;
  monthlyRetainer: number;
  probability: number;
  closeDate: string | Date | null;
  agreementSentAt: string | Date | null;
  agreementSignedAt: string | Date | null;
  paymentReceivedAt: string | Date | null;
  demoBookedAt: string | Date | null;
  demoDoneAt: string | Date | null;
  lostReason: string | null;
  notes: string | null;
  webhookFired: boolean;
}

const STAGES = [
  { key: "cold_outreach",    label: "Cold Outreach",    color: "#818cf8" },
  { key: "demo_booked",      label: "Demo Booked",      color: "#06b6d4" },
  { key: "demo_done",        label: "Demo Done",        color: "#a78bfa" },
  { key: "proposal_sent",    label: "Proposal Sent",    color: "#f59e0b" },
  { key: "agreement_signed", label: "Agreement Signed", color: "#10b981" },
  { key: "onboarding",       label: "Onboarding",       color: "#22c55e" },
  { key: "live",             label: "Live",             color: "#4ade80" },
  { key: "upsell",           label: "Upsell",           color: "#f97316" },
  { key: "lost",             label: "Lost",             color: "#ef4444" },
];

const systemTypeLabel: Record<string, string> = {
  reactivation: "Reactivation", hot_lead: "Hot Lead", backend: "Backend", combo: "Combo",
};
const systemTypeColor: Record<string, string> = {
  reactivation: "rgba(139,92,246,0.9)", hot_lead: "rgba(239,68,68,0.9)",
  backend: "rgba(6,182,212,0.9)", combo: "rgba(245,158,11,0.9)",
};

const stagePill: Record<string, { bg: string; color: string; border: string }> = {
  cold_outreach:    { bg: "rgba(129,140,248,0.12)", color: "#c7d2fe", border: "rgba(129,140,248,0.25)" },
  demo_booked:      { bg: "rgba(6,182,212,0.12)",   color: "#a5f3fc", border: "rgba(6,182,212,0.25)" },
  demo_done:        { bg: "rgba(167,139,250,0.12)", color: "#ddd6fe", border: "rgba(167,139,250,0.25)" },
  proposal_sent:    { bg: "rgba(245,158,11,0.12)",  color: "#fde68a", border: "rgba(245,158,11,0.25)" },
  agreement_signed: { bg: "rgba(16,185,129,0.12)",  color: "#6ee7b7", border: "rgba(16,185,129,0.25)" },
  onboarding:       { bg: "rgba(34,197,94,0.12)",   color: "#bbf7d0", border: "rgba(34,197,94,0.25)" },
  live:             { bg: "rgba(74,222,128,0.12)",  color: "#86efac", border: "rgba(74,222,128,0.25)" },
  upsell:           { bg: "rgba(249,115,22,0.12)",  color: "#fed7aa", border: "rgba(249,115,22,0.25)" },
  lost:             { bg: "rgba(239,68,68,0.10)",   color: "#fca5a5", border: "rgba(239,68,68,0.2)" },
};

export default function DealsClient({ initialDeals }: { initialDeals: Deal[] }) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);

  async function load() {
    const res = await fetch("/api/deals");
    if (res.ok) setDeals(await res.json());
  }

  function openNew() { setEditing(null); setModalOpen(true); }
  function openEdit(d: Deal) { setEditing(d); setModalOpen(true); }

  const filtered = deals.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));
  const activePipeline = deals.filter((d) => d.stage !== "lost").reduce((s, d) => s + (d.value ?? 0), 0);
  const liveCount = deals.filter((d) => d.stage === "live").length;
  const agreedCount = deals.filter((d) => d.agreementSignedAt).length;

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Pipeline</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 3 }}>
            {deals.length} deals &middot; {formatCurrency(activePipeline)} active &middot; {agreedCount} signed &middot; {liveCount} live
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: 3 }}>
            {(["board", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: view === v ? "rgba(99,102,241,0.25)" : "transparent", color: view === v ? "white" : "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.15s" }}>
                {v === "board" ? <Columns size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>
          <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
            <Plus size={15} /> New Deal
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pipeline..." style={{ width: "100%", maxWidth: 360, padding: "9px 14px 9px 34px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }} />
      </div>

      {/* ══ BOARD VIEW ══ */}
      {view === "board" && (
        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          {/* Scrollable track */}
          <div style={{
            display: "flex",
            gap: 14,
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: 28,
            paddingRight: 80,
            paddingLeft: 2,
            paddingTop: 2,
            alignItems: "flex-start",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(99,102,241,0.3) transparent",
          }}>
            {STAGES.map((stage) => {
              const stageDeals = filtered.filter((d) => d.stage === stage.key);
              const total = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
              return (
                <div key={stage.key} style={{
                  minWidth: 300,
                  width: 300,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  overflow: "hidden",
                  maxHeight: "calc(100vh - 260px)",
                }}>
                  {/* Lane header */}
                  <div style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                    flexShrink: 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color, boxShadow: `0 0 8px ${stage.color}80`, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>{stage.label}</span>
                        <span style={{ fontSize: 10.5, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", padding: "2px 7px", borderRadius: 999, fontWeight: 500 }}>{stageDeals.length}</span>
                      </div>
                      {total > 0 && (
                        <span style={{ fontSize: 11, color: stage.color, fontWeight: 600, opacity: 0.8 }}>{formatCurrency(total)}</span>
                      )}
                    </div>
                  </div>

                  {/* Lane body — scrollable */}
                  <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "12px 12px 8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    scrollbarWidth: "none",
                  }}>
                    {/* Empty state */}
                    {stageDeals.length === 0 && (
                      <div style={{ padding: "28px 12px", textAlign: "center", opacity: 0.4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px dashed ${stage.color}60`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                          <Plus size={13} color={stage.color} />
                        </div>
                        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>No deals</p>
                      </div>
                    )}

                    {/* Deal cards */}
                    {stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => openEdit(deal)}
                        style={{
                          padding: "14px 14px 12px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)";
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.3)";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                        }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 6, lineHeight: 1.4, letterSpacing: "-0.01em" }}>{deal.title}</p>

                        {deal.systemType && (
                          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 600, color: systemTypeColor[deal.systemType], background: `${systemTypeColor[deal.systemType].replace("0.9", "0.1")}`, padding: "2px 8px", borderRadius: 6, marginBottom: 8, border: `1px solid ${systemTypeColor[deal.systemType].replace("0.9", "0.2")}` }}>
                            {systemTypeLabel[deal.systemType]}
                          </span>
                        )}

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          {deal.monthlyRetainer > 0 && (
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{formatCurrency(deal.monthlyRetainer)}/mo</span>
                          )}
                          {deal.value > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 700, color: stage.color, marginLeft: "auto" }}>{formatCurrency(deal.value)}</span>
                          )}
                        </div>

                        {deal.agreementSignedAt && (
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "#4ade80", fontWeight: 600 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade8080" }} />
                            Signed
                          </div>
                        )}

                        {deal.probability > 0 && (
                          <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${deal.probability}%`, background: `linear-gradient(90deg, ${stage.color}80, ${stage.color})`, borderRadius: 3, transition: "width 0.3s ease" }} />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add deal button */}
                    <button
                      onClick={openNew}
                      style={{
                        marginTop: 4,
                        padding: "9px 14px",
                        borderRadius: 10,
                        border: "1px dashed rgba(255,255,255,0.1)",
                        background: "transparent",
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 12,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "all 0.15s",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = `${stage.color}50`;
                        (e.currentTarget as HTMLButtonElement).style.color = stage.color;
                        (e.currentTarget as HTMLButtonElement).style.background = `${stage.color}08`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)";
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <Plus size={12} /> Add deal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right fade mask — makes overflow feel intentional */}
          <div style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 28,
            width: 80,
            background: "linear-gradient(to right, transparent, #07070f)",
            pointerEvents: "none",
            zIndex: 2,
          }} />
        </div>
      )}

      {/* ══ LIST VIEW ══ */}
      {view === "list" && (
        <div className="glass" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Deal", "Stage", "System", "Setup", "MRR", "Value", "Prob"].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>No deals found.</td></tr>
              ) : filtered.map((deal, i) => {
                const stage = STAGES.find((s) => s.key === deal.stage);
                const pill = stagePill[deal.stage];
                return (
                  <tr key={deal.id} onClick={() => openEdit(deal)} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>{deal.title}</p>
                      {deal.agreementSignedAt && <span style={{ fontSize: 10.5, color: "#4ade80", fontWeight: 600 }}>✓ Signed</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {pill && <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: pill.bg, color: pill.color, border: `1px solid ${pill.border}` }}>{stage?.label ?? deal.stage}</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: deal.systemType ? systemTypeColor[deal.systemType] : "rgba(255,255,255,0.25)" }}>
                      {deal.systemType ? systemTypeLabel[deal.systemType] : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{deal.setupFee > 0 ? formatCurrency(deal.setupFee) : "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{deal.monthlyRetainer > 0 ? `${formatCurrency(deal.monthlyRetainer)}/mo` : "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: stage?.color ?? "white" }}>{deal.value > 0 ? formatCurrency(deal.value) : "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {deal.probability > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 48, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${deal.probability}%`, background: stage?.color ?? "#6366f1", borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{deal.probability}%</span>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <DealModal deal={editing} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
    </div>
  );
}
