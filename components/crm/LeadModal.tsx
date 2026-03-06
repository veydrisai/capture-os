"use client";

import { useState } from "react";
import { X } from "lucide-react";

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
}

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS = [
  { key: "new",            label: "New" },
  { key: "contacted",      label: "Contacted" },
  { key: "interested",     label: "Interested" },
  { key: "demo_scheduled", label: "Demo Scheduled" },
  { key: "no_show",        label: "No Show" },
  { key: "not_qualified",  label: "Not Qualified" },
  { key: "qualified",      label: "Qualified" },
  { key: "closed",         label: "Closed" },
];

const SYSTEM_TYPES = [
  { key: "", label: "None" },
  { key: "reactivation", label: "Reactivation" },
  { key: "hot_lead",     label: "Hot Lead" },
  { key: "backend",      label: "Backend" },
  { key: "combo",        label: "Combo" },
];

export default function LeadModal({ lead, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    firstName: lead?.firstName ?? "",
    lastName: lead?.lastName ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    company: lead?.company ?? "",
    status: lead?.status ?? "new",
    source: lead?.source ?? "",
    industry: lead?.industry ?? "",
    estimatedValue: lead?.estimatedValue?.toString() ?? "",
    systemInterest: lead?.systemInterest ?? "",
    notes: lead?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const method = lead ? "PATCH" : "POST";
      const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!lead || !confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-strong" style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", letterSpacing: "-0.02em" }}>
            {lead ? "Edit Lead" : "New Lead"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="First Name" value={form.firstName} onChange={(v) => up("firstName", v)} required />
            <Field label="Last Name" value={form.lastName} onChange={(v) => up("lastName", v)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Email" value={form.email} onChange={(v) => up("email", v)} type="email" />
            <Field label="Phone" value={form.phone} onChange={(v) => up("phone", v)} type="tel" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Company" value={form.company} onChange={(v) => up("company", v)} />
            <Field label="Industry" value={form.industry} onChange={(v) => up("industry", v)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SelectField label="Status" value={form.status} onChange={(v) => up("status", v)} options={STATUS_OPTIONS} />
            <SelectField label="System Interest" value={form.systemInterest} onChange={(v) => up("systemInterest", v)} options={SYSTEM_TYPES} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Source" value={form.source} onChange={(v) => up("source", v)} />
            <Field label="Est. Value ($)" value={form.estimatedValue} onChange={(v) => up("estimatedValue", v)} type="number" />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => up("notes", e.target.value)}
              rows={3}
              style={textareaStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#fca5a5", padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {lead && (
              <button type="button" onClick={handleDelete} style={deleteBtnStyle}>Delete</button>
            )}
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...saveBtnStyle, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, fontFamily: "inherit" };
const deleteBtnStyle: React.CSSProperties = { padding: "9px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13, cursor: "pointer" };
const cancelBtnStyle: React.CSSProperties = { flex: 1, padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" };
const saveBtnStyle: React.CSSProperties = { flex: 2, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 500 };

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label style={labelStyle}>{label} {required && <span style={{ color: "#f87171" }}>*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={inputStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </div>
  );
}
