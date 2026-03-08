"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Lead {
  id: string; firstName: string; lastName: string; email: string | null; phone: string | null;
  company: string | null; status: string; source: string | null; industry: string | null;
  estimatedValue: number; systemInterest: string | null; notes: string | null;
}

interface Props { lead: Lead | null; onClose: () => void; onSaved: () => void; }

const STATUS_OPTIONS = [
  { key: "new", label: "New" }, { key: "contacted", label: "Contacted" },
  { key: "interested", label: "Interested" }, { key: "demo_scheduled", label: "Demo Scheduled" },
  { key: "no_show", label: "No Show" }, { key: "not_qualified", label: "Not Qualified" },
  { key: "qualified", label: "Qualified" }, { key: "closed", label: "Closed" },
];

const SYSTEM_TYPES = [
  { key: "", label: "None" }, { key: "reactivation", label: "Reactivation" },
  { key: "hot_lead", label: "Hot Lead" }, { key: "backend", label: "Backend" }, { key: "combo", label: "Combo" },
];

export default function LeadModal({ lead, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    firstName: lead?.firstName ?? "", lastName: lead?.lastName ?? "",
    email: lead?.email ?? "", phone: lead?.phone ?? "", company: lead?.company ?? "",
    status: lead?.status ?? "new", source: lead?.source ?? "", industry: lead?.industry ?? "",
    estimatedValue: lead?.estimatedValue?.toString() ?? "",
    systemInterest: lead?.systemInterest ?? "", notes: lead?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const res = await fetch(lead ? `/api/leads/${lead.id}` : "/api/leads", {
        method: lead ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!lead || !confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-scale-in" style={panel}>
        {/* Fixed header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{lead ? "Edit Lead" : "New Lead"}</h2>
            <p style={subtitleStyle}>{lead ? "Update record" : "Add to pipeline"}</p>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Scrollable body */}
          <div style={bodyStyle}>
            <div style={grid2}>
              <Field label="First Name" value={form.firstName} onChange={(v) => up("firstName", v)} required />
              <Field label="Last Name" value={form.lastName} onChange={(v) => up("lastName", v)} />
            </div>
            <div style={grid2}>
              <Field label="Email" value={form.email} onChange={(v) => up("email", v)} type="email" />
              <Field label="Phone" value={form.phone} onChange={(v) => up("phone", v)} type="tel" />
            </div>
            <div style={grid2}>
              <Field label="Company" value={form.company} onChange={(v) => up("company", v)} />
              <Field label="Industry" value={form.industry} onChange={(v) => up("industry", v)} />
            </div>
            <div style={grid2}>
              <SelectF label="Status" value={form.status} onChange={(v) => up("status", v)} options={STATUS_OPTIONS} />
              <SelectF label="System Interest" value={form.systemInterest} onChange={(v) => up("systemInterest", v)} options={SYSTEM_TYPES} />
            </div>
            <div style={grid2}>
              <Field label="Source" value={form.source} onChange={(v) => up("source", v)} />
              <Field label="Est. Value ($)" value={form.estimatedValue} onChange={(v) => up("estimatedValue", v)} type="number" />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={3} style={textareaStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            {error && <p style={errorStyle}>{error}</p>}
          </div>

          {/* Fixed footer */}
          <div style={footerStyle}>
            {lead && <button type="button" onClick={handleDelete} style={deleteBtn}>Delete</button>}
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...saveBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} style={inputStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function SelectF({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </div>
  );
}

const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 };
const panel: React.CSSProperties = { width: "calc(100vw - 32px)", maxWidth: 840, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#0f0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3)" };
const headerStyle: React.CSSProperties = { flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" };
const bodyStyle: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 };
const footerStyle: React.CSSProperties = { flexShrink: 0, display: "flex", gap: 10, padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.07)" };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "-0.03em", marginBottom: 3 };
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: "rgba(99,102,241,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4, marginTop: -2 };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none" };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical", lineHeight: 1.6 };
const deleteBtn: React.CSSProperties = { padding: "10px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const cancelBtn: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const saveBtn: React.CSSProperties = { flex: 2, padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10 };
