"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
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
  reactivation: "rgba(99,102,241,0.8)", hot_lead: "rgba(239,68,68,0.8)", backend: "rgba(6,182,212,0.8)", combo: "rgba(245,158,11,0.8)",
};

export default function DealsClient({ initialDeals }: { initialDeals: Deal[] }) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);

  async function load() {
    const res = await fetch("/api/deals");
    if (res.ok) setDeals(await res.json());
  }

  const filtered = deals.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));
  const activePipeline = deals.filter((d) => d.stage !== "lost").reduce((s, d) => s + (d.value ?? 0), 0);
  const liveCount = deals.filter((d) => d.stage === "live").length;
  const agreedCount = deals.filter((d) => d.agreementSignedAt).length;

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Pipeline</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>
            {deals.length} deals · {formatCurrency(activePipeline)} pipeline · {agreedCount} signed · {liveCount} live
          </p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <Plus size={15} /> Add Deal
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 24, marginTop: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pipeline..." style={{ width: "100%", maxWidth: 360, padding: "9px 14px 9px 34px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }} />
      </div>

      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 20, paddingRight: 4, alignItems: "flex-start", width: "100%" }}>
        {STAGES.map((stage) => {
          const stageDeals = filtered.filter((d) => d.stage === stage.key);
          const total = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
          return (
            <div key={stage.key} style={{ minWidth: 240, width: 240, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: stage.color, boxShadow: `0 0 6px ${stage.color}60` }} />
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: "white" }}>{stage.label}</span>
                  <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", padding: "1px 5px", borderRadius: 999 }}>{stageDeals.length}</span>
                </div>
                {total > 0 && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{formatCurrency(total)}</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {stageDeals.map((deal) => (
                  <div key={deal.id} className="glass-sm card-hover" onClick={() => { setEditing(deal); setModalOpen(true); }} style={{ padding: 12, cursor: "pointer" }}>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: "white", marginBottom: 6, lineHeight: 1.35 }}>{deal.title}</p>
                    {deal.systemType && <span style={{ fontSize: 10, color: systemTypeColor[deal.systemType] ?? "rgba(255,255,255,0.4)", fontWeight: 500, display: "block", marginBottom: 4 }}>{systemTypeLabel[deal.systemType]}</span>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      {deal.monthlyRetainer > 0 && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{formatCurrency(deal.monthlyRetainer)}/mo</span>}
                      {deal.value > 0 && <span style={{ fontSize: 11.5, fontWeight: 600, color: stage.color }}>{formatCurrency(deal.value)}</span>}
                    </div>
                    {deal.agreementSignedAt && (
                      <div style={{ marginTop: 5, fontSize: 10, color: "#4ade80", display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} /> Signed
                      </div>
                    )}
                    {deal.probability > 0 && (
                      <div style={{ marginTop: 7, height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${deal.probability}%`, background: stage.color, borderRadius: 2, opacity: 0.7 }} />
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => { setEditing(null); setModalOpen(true); }} style={{ padding: "7px", borderRadius: 9, border: "1px dashed rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.2)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Plus size={11} /> Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && <DealModal deal={editing} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
    </div>
  );
}
