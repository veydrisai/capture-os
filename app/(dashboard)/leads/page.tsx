"use client";

import { useState, useEffect } from "react";
import { Plus, Search, List, Columns } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import LeadModal from "@/components/crm/LeadModal";

interface Lead {
  id: string;
  title: string;
  status: string;
  source: string | null;
  value: number;
  notes: string | null;
  createdAt: string;
}

const STAGES = [
  { key: "new",          label: "New",          color: "#6366f1" },
  { key: "contacted",    label: "Contacted",    color: "#06b6d4" },
  { key: "qualified",    label: "Qualified",    color: "#22c55e" },
  { key: "proposal",     label: "Proposal",     color: "#f59e0b" },
  { key: "negotiation",  label: "Negotiation",  color: "#f97316" },
  { key: "closed_won",   label: "Closed Won",   color: "#10b981" },
  { key: "closed_lost",  label: "Closed Lost",  color: "#ef4444" },
];

const statusColors: Record<string, string> = {
  new: "pill-new",
  contacted: "pill-contacted",
  qualified: "pill-qualified",
  proposal: "pill-proposal",
  negotiation: "pill-negotiation",
  closed_won: "pill-won",
  closed_lost: "pill-lost",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = leads.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>
            Leads
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>
            {leads.length} total leads
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* View toggle */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 10,
              padding: 3,
            }}
          >
            {(["kanban", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: view === v ? "rgba(99,102,241,0.2)" : "transparent",
                  color: view === v ? "white" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {v === "kanban" ? <Columns size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          style={{
            width: "100%",
            maxWidth: 360,
            padding: "9px 14px 9px 34px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "white",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16 }}>
          {STAGES.map((stage) => {
            const stageLeads = filtered.filter((l) => l.status === stage.key);
            const total = stageLeads.reduce((s, l) => s + (l.value ?? 0), 0);
            return (
              <div
                key={stage.key}
                style={{
                  minWidth: 240,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "white" }}>{stage.label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.5)",
                        padding: "1px 6px",
                        borderRadius: 999,
                      }}
                    >
                      {stageLeads.length}
                    </span>
                  </div>
                  {total > 0 && (
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                      {formatCurrency(total)}
                    </span>
                  )}
                </div>

                {/* Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="glass-sm"
                      onClick={() => { setEditing(lead); setModalOpen(true); }}
                      style={{
                        padding: "14px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.14)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 500, color: "white", marginBottom: 8, lineHeight: 1.4 }}>
                        {lead.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {lead.source && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                            {lead.source}
                          </span>
                        )}
                        {lead.value > 0 && (
                          <span style={{ fontSize: 12, fontWeight: 500, color: stage.color }}>
                            {formatCurrency(lead.value)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add to stage */}
                  <button
                    onClick={() => {
                      setEditing(null);
                      setModalOpen(true);
                    }}
                    style={{
                      padding: "8px",
                      borderRadius: 10,
                      border: "1px dashed rgba(255,255,255,0.08)",
                      background: "transparent",
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="glass" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Title", "Status", "Source", "Value", "Created", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No leads found.</td></tr>
              ) : (
                filtered.map((lead, i) => (
                  <tr
                    key={lead.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}
                    onClick={() => { setEditing(lead); setModalOpen(true); }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "white" }}>{lead.title}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`pill ${statusColors[lead.status] ?? "pill-new"}`}>{lead.status.replace("_", " ")}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{lead.source ?? "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
                      {lead.value > 0 ? formatCurrency(lead.value) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, color: "rgba(99,102,241,0.7)" }}>Edit →</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <LeadModal
          lead={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
