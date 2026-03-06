"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import DealModal from "@/components/crm/DealModal";

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  closeDate: string | null;
  notes: string | null;
  createdAt: string;
}

const STAGES = [
  { key: "prospecting",   label: "Prospecting",   color: "#6366f1" },
  { key: "qualification", label: "Qualification", color: "#06b6d4" },
  { key: "proposal",      label: "Proposal",      color: "#f59e0b" },
  { key: "negotiation",   label: "Negotiation",   color: "#f97316" },
  { key: "closed_won",    label: "Closed Won",    color: "#10b981" },
  { key: "closed_lost",   label: "Closed Lost",   color: "#ef4444" },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/deals");
    const data = await res.json();
    setDeals(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = deals.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const pipelineValue = deals
    .filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
    .reduce((s, d) => s + (d.value ?? 0), 0);

  const wonValue = deals
    .filter((d) => d.stage === "closed_won")
    .reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>
            Deals
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>
            {deals.length} deals · Pipeline: {formatCurrency(pipelineValue)} · Won: {formatCurrency(wonValue)}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          <Plus size={15} /> Add Deal
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search deals..."
          style={{ width: "100%", maxWidth: 360, padding: "9px 14px 9px 34px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }}
        />
      </div>

      {/* Pipeline Kanban */}
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16 }}>
        {STAGES.map((stage) => {
          const stageDeals = filtered.filter((d) => d.stage === stage.key);
          const total = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
          return (
            <div key={stage.key} style={{ minWidth: 240, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: "white" }}>{stage.label}</span>
                  <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", padding: "1px 6px", borderRadius: 999 }}>
                    {stageDeals.length}
                  </span>
                </div>
                {total > 0 && (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{formatCurrency(total)}</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="glass-sm"
                    onClick={() => { setEditing(deal); setModalOpen(true); }}
                    style={{ padding: 14, cursor: "pointer", transition: "all 0.15s ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.14)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: "white", marginBottom: 8, lineHeight: 1.4 }}>{deal.title}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {deal.probability > 0 && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{deal.probability}%</span>
                      )}
                      {deal.value > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 500, color: stage.color }}>{formatCurrency(deal.value)}</span>
                      )}
                    </div>
                    {deal.closeDate && (
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
                        Close: {new Date(deal.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                    {/* Probability bar */}
                    {deal.probability > 0 && (
                      <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${deal.probability}%`, background: stage.color, borderRadius: 2, opacity: 0.7 }} />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => { setEditing(null); setModalOpen(true); }}
                  style={{ padding: "8px", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <DealModal
          deal={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
