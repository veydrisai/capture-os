"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Zap } from "lucide-react";

interface Deal {
  id: string; title: string; stage: string; systemType: string | null;
  contactId: string | null;
  value: number; setupFee: number; monthlyRetainer: number; probability: number;
  closeDate: string | Date | null; agreementSentAt: string | Date | null; agreementSignedAt: string | Date | null;
  paymentReceivedAt: string | Date | null; demoBookedAt: string | Date | null; demoDoneAt: string | Date | null;
  lostReason: string | null; notes: string | null; webhookFired: boolean;
}

interface Contact { id: string; firstName: string; lastName: string; company: string | null; }

interface Props { deal: Deal | null; onClose: () => void; onSaved: () => void; }

const STAGE_OPTIONS = [
  { key: "cold_outreach", label: "Cold Outreach" }, { key: "demo_booked", label: "Demo Booked" },
  { key: "demo_done", label: "Demo Done" }, { key: "proposal_sent", label: "Proposal Sent" },
  { key: "agreement_signed", label: "Agreement Signed" }, { key: "onboarding", label: "Onboarding" },
  { key: "live", label: "Live" }, { key: "upsell", label: "Upsell" }, { key: "lost", label: "Lost" },
];

const SYSTEM_TYPES = [
  { key: "", label: "None" }, { key: "reactivation", label: "Reactivation" },
  { key: "hot_lead", label: "Hot Lead" }, { key: "backend", label: "Backend" }, { key: "combo", label: "Combo" },
];

function toDate(val: string | Date | null | undefined) { return val ? String(val).split("T")[0] : ""; }

export default function DealModal({ deal, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    title: deal?.title ?? "", stage: deal?.stage ?? "cold_outreach",
    contactId: deal?.contactId ?? "",
    systemType: deal?.systemType ?? "", value: deal?.value?.toString() ?? "",
    setupFee: deal?.setupFee?.toString() ?? "", monthlyRetainer: deal?.monthlyRetainer?.toString() ?? "",
    probability: deal?.probability?.toString() ?? "", closeDate: toDate(deal?.closeDate),
    agreementSentAt: toDate(deal?.agreementSentAt), agreementSignedAt: toDate(deal?.agreementSignedAt),
    paymentReceivedAt: toDate(deal?.paymentReceivedAt), demoBookedAt: toDate(deal?.demoBookedAt),
    demoDoneAt: toDate(deal?.demoDoneAt), lostReason: deal?.lostReason ?? "", notes: deal?.notes ?? "",
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetch("/api/contacts?limit=200")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Contact[]) => setContacts(data))
      .catch(() => {});
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const res = await fetch(deal ? `/api/deals/${deal.id}` : "/api/deals", {
        method: deal ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deal || !confirm("Delete this deal?")) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const modal = (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-scale-in" style={panel}>
        {/* Fixed header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{deal ? "Edit Deal" : "New Deal"}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3 }}>
              <p style={subtitleStyle}>{deal ? "Update pipeline record" : "Add to pipeline"}</p>
              {deal?.webhookFired && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#4ade80", fontWeight: 600 }}><Zap size={10} /> n8n fired</span>}
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Scrollable body */}
          <div style={bodyStyle}>
            <Field label="Deal / Company Name" value={form.title} onChange={(v) => up("title", v)} required />
            <div>
              <label style={labelStyle}>Linked Contact</label>
              <select value={form.contactId} onChange={(e) => up("contactId", e.target.value)} style={selectStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <option value="">— No contact linked —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.company ? ` · ${c.company}` : ""}</option>
                ))}
              </select>
            </div>
            <div style={grid2}>
              <SelectF label="Stage" value={form.stage} onChange={(v) => up("stage", v)} options={STAGE_OPTIONS} />
              <SelectF label="System Type" value={form.systemType} onChange={(v) => up("systemType", v)} options={SYSTEM_TYPES} />
            </div>
            <div style={grid3}>
              <Field label="Setup Fee ($)" value={form.setupFee} onChange={(v) => up("setupFee", v)} type="number" />
              <Field label="Monthly Retainer ($)" value={form.monthlyRetainer} onChange={(v) => up("monthlyRetainer", v)} type="number" />
              <Field label="Total Value ($)" value={form.value} onChange={(v) => up("value", v)} type="number" />
            </div>
            <div style={grid2}>
              <Field label="Probability (%)" value={form.probability} onChange={(v) => up("probability", v)} type="number" />
              <Field label="Close Date" value={form.closeDate} onChange={(v) => up("closeDate", v)} type="date" />
            </div>

            <div>
              <p style={sectionLabel}>Timeline Tracking</p>
              <div style={grid2}>
                <Field label="Demo Booked" value={form.demoBookedAt} onChange={(v) => up("demoBookedAt", v)} type="date" />
                <Field label="Demo Done" value={form.demoDoneAt} onChange={(v) => up("demoDoneAt", v)} type="date" />
                <Field label="Agreement Sent" value={form.agreementSentAt} onChange={(v) => up("agreementSentAt", v)} type="date" />
                <Field label="Agreement Signed" value={form.agreementSignedAt} onChange={(v) => up("agreementSignedAt", v)} type="date" />
                <Field label="Payment Received" value={form.paymentReceivedAt} onChange={(v) => up("paymentReceivedAt", v)} type="date" />
              </div>
            </div>

            {form.stage === "lost" && <Field label="Lost Reason" value={form.lostReason} onChange={(v) => up("lostReason", v)} />}

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={3} style={textareaStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            {error && <p style={errorStyle}>{error}</p>}
          </div>

          {/* Fixed footer */}
          <div style={footerStyle}>
            {deal && <button type="button" onClick={handleDelete} style={deleteBtn}>Delete</button>}
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...saveBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : deal ? "Save Changes" : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} style={inputStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
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
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
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
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: "rgba(124,58,237,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4, marginTop: -2 };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 };
const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none" };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical", lineHeight: 1.6 };
const deleteBtn: React.CSSProperties = { padding: "10px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const cancelBtn: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const saveBtn: React.CSSProperties = { flex: 2, padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #A855F7)", border: "none", color: "white", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10 };
