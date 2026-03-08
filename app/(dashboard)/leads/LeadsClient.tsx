"use client";

import { useState } from "react";
import { Plus, Search, List, Columns, Upload } from "lucide-react";
import LeadModal from "@/components/crm/LeadModal";
import LeadImportModal from "@/components/crm/LeadImportModal";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  source: string | null;
  industry: string | null;
  estimatedValue: number;
  systemInterest: string | null;
  notes: string | null;
  createdAt: string | Date;
}

const STAGES = [
  { key: "new",            label: "New",            color: "#818cf8" },
  { key: "contacted",      label: "Contacted",      color: "#06b6d4" },
  { key: "interested",     label: "Interested",     color: "#a78bfa" },
  { key: "demo_scheduled", label: "Demo Scheduled", color: "#f59e0b" },
  { key: "no_show",        label: "No Show",        color: "#f97316" },
  { key: "not_qualified",  label: "Not Qualified",  color: "#6b7280" },
  { key: "qualified",      label: "Qualified",      color: "#22c55e" },
  { key: "closed",         label: "Closed",         color: "#10b981" },
];

const statusPill: Record<string, { bg: string; color: string; border: string }> = {
  new:            { bg: "rgba(129,140,248,0.15)", color: "#c7d2fe", border: "rgba(129,140,248,0.3)" },
  contacted:      { bg: "rgba(6,182,212,0.15)",   color: "#a5f3fc", border: "rgba(6,182,212,0.3)" },
  interested:     { bg: "rgba(167,139,250,0.15)", color: "#ddd6fe", border: "rgba(167,139,250,0.3)" },
  demo_scheduled: { bg: "rgba(245,158,11,0.15)",  color: "#fde68a", border: "rgba(245,158,11,0.3)" },
  no_show:        { bg: "rgba(249,115,22,0.15)",  color: "#fed7aa", border: "rgba(249,115,22,0.3)" },
  not_qualified:  { bg: "rgba(107,114,128,0.15)", color: "#d1d5db", border: "rgba(107,114,128,0.3)" },
  qualified:      { bg: "rgba(34,197,94,0.15)",   color: "#bbf7d0", border: "rgba(34,197,94,0.3)" },
  closed:         { bg: "rgba(16,185,129,0.18)",  color: "#6ee7b7", border: "rgba(16,185,129,0.35)" },
};

const systemTypeLabel: Record<string, string> = {
  reactivation: "Reactivation", hot_lead: "Hot Lead", backend: "Backend", combo: "Combo",
};

function fullName(l: Lead) { return `${l.firstName} ${l.lastName}`.trim(); }

export default function LeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/leads");
    if (res.ok) setLeads(await res.json());
  }

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return fullName(l).toLowerCase().includes(q) || (l.company ?? "").toLowerCase().includes(q) || (l.email ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Leads</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>{leads.length} total leads</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: 3 }}>
            {(["kanban", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: view === v ? "rgba(99,102,241,0.2)" : "transparent", color: view === v ? "white" : "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                {v === "kanban" ? <Columns size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>
          <button onClick={() => setImportOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            <Upload size={15} /> Import CSV
          </button>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, company, email..." style={{ width: "100%", maxWidth: 380, padding: "9px 14px 9px 34px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }} />
      </div>

      {view === "kanban" && (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 20, paddingRight: 4, alignItems: "flex-start", width: "100%" }}>
          {STAGES.map((stage) => {
            const stageLeads = filtered.filter((l) => l.status === stage.key);
            return (
              <div key={stage.key} style={{ minWidth: 220, width: 220, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: stage.color, boxShadow: `0 0 6px ${stage.color}60` }} />
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: "white" }}>{stage.label}</span>
                  <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", padding: "1px 5px", borderRadius: 999 }}>{stageLeads.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="glass-sm card-hover" onClick={() => { setEditing(lead); setModalOpen(true); }} style={{ padding: 12, cursor: "pointer" }}>
                      <p style={{ fontSize: 12.5, fontWeight: 500, color: "white", marginBottom: 3 }}>{fullName(lead)}</p>
                      {lead.company && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{lead.company}</p>}
                      {lead.systemInterest && <span style={{ fontSize: 10, color: "rgba(167,139,250,0.8)", fontWeight: 500 }}>{systemTypeLabel[lead.systemInterest]}</span>}
                      {lead.estimatedValue > 0 && <p style={{ fontSize: 11.5, fontWeight: 600, color: stage.color, marginTop: 4 }}>${lead.estimatedValue.toLocaleString()}</p>}
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
      )}

      {view === "list" && (
        <div className="glass" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Name", "Company", "Status", "System", "Source", "Value", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No leads found.</td></tr>
              ) : filtered.map((lead, i) => {
                const pill = statusPill[lead.status];
                return (
                  <tr key={lead.id} className="row-hover" style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }} onClick={() => { setEditing(lead); setModalOpen(true); }}>
                    <td style={{ padding: "11px 14px" }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "white" }}>{fullName(lead)}</p>
                      {lead.email && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{lead.email}</p>}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>{lead.company ?? "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      {pill ? <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: pill.bg, color: pill.color, border: `1px solid ${pill.border}` }}>{lead.status.replace(/_/g, " ")}</span> : lead.status}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "rgba(167,139,250,0.8)" }}>{lead.systemInterest ? systemTypeLabel[lead.systemInterest] : "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{lead.source ?? "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{lead.estimatedValue > 0 ? `$${lead.estimatedValue.toLocaleString()}` : "—"}</td>
                    <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 12, color: "rgba(99,102,241,0.7)" }}>Edit →</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <LeadModal lead={editing} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
      {importOpen && <LeadImportModal onClose={() => setImportOpen(false)} onImported={load} />}
    </div>
  );
}
