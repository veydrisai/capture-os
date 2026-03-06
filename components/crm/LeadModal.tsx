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
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-strong animate-scale-in" style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>
              {lead ? "Edit Lead" : "New Lead"}
            </h2>
            <p style={{ fontSize: 11, color: "rgba(99,102,241,0.7)", marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
              {lead ? "Update record" : "Add to pipeline"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
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
            <div>
              <label className="modal-label">Status</label>
              <select value={form.status} onChange={(e) => up("status", e.target.value)} className="modal-select">
                {STATUS_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="modal-label">System Interest</label>
              <select value={form.systemInterest} onChange={(e) => up("systemInterest", e.target.value)} className="modal-select">
                {SYSTEM_TYPES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Source" value={form.source} onChange={(v) => up("source", v)} />
            <Field label="Est. Value ($)" value={form.estimatedValue} onChange={(v) => up("estimatedValue", v)} type="number" />
          </div>
          <div>
            <label className="modal-label">Notes</label>
            <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={3} className="modal-textarea" />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {lead && <button type="button" onClick={handleDelete} className="modal-btn-delete">Delete</button>}
            <button type="button" onClick={onClose} className="modal-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving} className="modal-btn-save">
              {saving ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="modal-label">{label} {required && <span style={{ color: "#f87171" }}>*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="modal-input" />
    </div>
  );
}
