"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  closeDate: string | null;
  notes: string | null;
}

interface Props {
  deal: Deal | null;
  onClose: () => void;
  onSaved: () => void;
}

const STAGE_OPTIONS = [
  "prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost",
];

export default function DealModal({ deal, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    title: deal?.title ?? "",
    stage: deal?.stage ?? "prospecting",
    value: deal?.value?.toString() ?? "",
    probability: deal?.probability?.toString() ?? "",
    closeDate: deal?.closeDate ? deal.closeDate.split("T")[0] : "",
    notes: deal?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const method = deal ? "PATCH" : "POST";
      const url = deal ? `/api/deals/${deal.id}` : "/api/deals";
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
    if (!deal) return;
    if (!confirm("Delete this deal?")) return;
    await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-strong" style={{ width: "100%", maxWidth: 500, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", letterSpacing: "-0.02em" }}>
            {deal ? "Edit Deal" : "New Deal"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Deal Title" value={form.title} onChange={(v) => update("title", v)} required />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Stage</label>
              <select
                value={form.stage}
                onChange={(e) => update("stage", e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }}
              >
                {STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <Field label="Value ($)" value={form.value} onChange={(v) => update("value", v)} type="number" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Probability (%)" value={form.probability} onChange={(v) => update("probability", v)} type="number" />
            <Field label="Close Date" value={form.closeDate} onChange={(v) => update("closeDate", v)} type="date" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#fca5a5", padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {deal && (
              <button type="button" onClick={handleDelete} style={{ padding: "9px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13, cursor: "pointer" }}>
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : deal ? "Save Changes" : "Create Deal"}
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
      <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
      />
    </div>
  );
}
