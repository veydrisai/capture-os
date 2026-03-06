"use client";

import { useState } from "react";
import { X, Zap } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  stage: string;
  systemType: string | null;
  value: number;
  setupFee: number;
  monthlyRetainer: number;
  probability: number;
  closeDate: string | null;
  agreementSentAt: string | null;
  agreementSignedAt: string | null;
  paymentReceivedAt: string | null;
  demoBookedAt: string | null;
  demoDoneAt: string | null;
  lostReason: string | null;
  notes: string | null;
  webhookFired: boolean;
}

interface Props {
  deal: Deal | null;
  onClose: () => void;
  onSaved: () => void;
}

const STAGE_OPTIONS = [
  { key: "cold_outreach",    label: "Cold Outreach" },
  { key: "demo_booked",      label: "Demo Booked" },
  { key: "demo_done",        label: "Demo Done" },
  { key: "proposal_sent",    label: "Proposal Sent" },
  { key: "agreement_signed", label: "Agreement Signed" },
  { key: "onboarding",       label: "Onboarding" },
  { key: "live",             label: "Live" },
  { key: "upsell",           label: "Upsell" },
  { key: "lost",             label: "Lost" },
];

const SYSTEM_TYPES = [
  { key: "", label: "None" },
  { key: "reactivation", label: "Reactivation" },
  { key: "hot_lead",     label: "Hot Lead" },
  { key: "backend",      label: "Backend" },
  { key: "combo",        label: "Combo" },
];

function toDateInput(val: string | null | undefined) {
  if (!val) return "";
  return String(val).split("T")[0];
}

export default function DealModal({ deal, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    title: deal?.title ?? "",
    stage: deal?.stage ?? "cold_outreach",
    systemType: deal?.systemType ?? "",
    value: deal?.value?.toString() ?? "",
    setupFee: deal?.setupFee?.toString() ?? "",
    monthlyRetainer: deal?.monthlyRetainer?.toString() ?? "",
    probability: deal?.probability?.toString() ?? "",
    closeDate: toDateInput(deal?.closeDate),
    agreementSentAt: toDateInput(deal?.agreementSentAt),
    agreementSignedAt: toDateInput(deal?.agreementSignedAt),
    paymentReceivedAt: toDateInput(deal?.paymentReceivedAt),
    demoBookedAt: toDateInput(deal?.demoBookedAt),
    demoDoneAt: toDateInput(deal?.demoDoneAt),
    lostReason: deal?.lostReason ?? "",
    notes: deal?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
    if (!deal || !confirm("Delete this deal?")) return;
    await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-strong animate-scale-in" style={{ width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>
              {deal ? "Edit Deal" : "New Deal"}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <p style={{ fontSize: 11, color: "rgba(99,102,241,0.7)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
                {deal ? "Update pipeline record" : "Add to pipeline"}
              </p>
              {deal?.webhookFired && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#4ade80", fontWeight: 600 }}>
                  <Zap size={9} /> Make fired
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Deal / Company Name" value={form.title} onChange={(v) => up("title", v)} required />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="modal-label">Stage</label>
              <select value={form.stage} onChange={(e) => up("stage", e.target.value)} className="modal-select">
                {STAGE_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="modal-label">System Type</label>
              <select value={form.systemType} onChange={(e) => up("systemType", e.target.value)} className="modal-select">
                {SYSTEM_TYPES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Setup Fee ($)" value={form.setupFee} onChange={(v) => up("setupFee", v)} type="number" />
            <Field label="Monthly Retainer ($)" value={form.monthlyRetainer} onChange={(v) => up("monthlyRetainer", v)} type="number" />
            <Field label="Total Value ($)" value={form.value} onChange={(v) => up("value", v)} type="number" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Probability (%)" value={form.probability} onChange={(v) => up("probability", v)} type="number" />
            <Field label="Close Date" value={form.closeDate} onChange={(v) => up("closeDate", v)} type="date" />
          </div>

          <div>
            <p className="modal-section">Timeline Tracking</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Demo Booked" value={form.demoBookedAt} onChange={(v) => up("demoBookedAt", v)} type="date" />
              <Field label="Demo Done" value={form.demoDoneAt} onChange={(v) => up("demoDoneAt", v)} type="date" />
              <Field label="Agreement Sent" value={form.agreementSentAt} onChange={(v) => up("agreementSentAt", v)} type="date" />
              <Field label="Agreement Signed" value={form.agreementSignedAt} onChange={(v) => up("agreementSignedAt", v)} type="date" />
              <Field label="Payment Received" value={form.paymentReceivedAt} onChange={(v) => up("paymentReceivedAt", v)} type="date" />
            </div>
          </div>

          {form.stage === "lost" && (
            <Field label="Lost Reason" value={form.lostReason} onChange={(v) => up("lostReason", v)} />
          )}

          <div>
            <label className="modal-label">Notes</label>
            <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={3} className="modal-textarea" />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {deal && <button type="button" onClick={handleDelete} className="modal-btn-delete">Delete</button>}
            <button type="button" onClick={onClose} className="modal-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving} className="modal-btn-save">
              {saving ? "Saving..." : deal ? "Save Changes" : "Create Deal"}
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
