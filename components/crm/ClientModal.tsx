"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, Send } from "lucide-react";

interface Client {
  id: string; businessName: string; email: string | null; systemType: string | null; onboardingStatus: string;
  contactId: string | null; dealId: string | null;
  intakeFormSent: boolean; intakeFormComplete: boolean; complianceReviewed: boolean;
  complianceApproved: boolean; accountsChecklist: boolean; kickoffScheduled: boolean;
  kickoffDone: boolean; buildComplete: boolean; testingComplete: boolean; softLaunchDone: boolean;
  goLiveDate: string | Date | null; twilioAccountSid: string | null; vapiAssistantId: string | null;
  makeWebhookUrl: string | null; roiDashboardUrl: string | null; monthlyRetainer: number;
  nextBillingDate: string | Date | null; complianceNotes: string | null; notes: string | null;
}

interface Contact { id: string; firstName: string; lastName: string; company: string | null; }
interface Deal { id: string; title: string; stage: string; }

interface Props { client: Client | null; onClose: () => void; onSaved: () => void; }

const ONBOARDING_STATUSES = [
  { key: "pending", label: "Pending" }, { key: "intake_sent", label: "Intake Sent" },
  { key: "intake_complete", label: "Intake Complete" }, { key: "compliance_review", label: "Compliance Review" },
  { key: "compliance_approved", label: "Compliance Approved" }, { key: "building", label: "Building" },
  { key: "testing", label: "Testing" }, { key: "soft_launch", label: "Soft Launch" }, { key: "live", label: "Live" },
];

const SYSTEM_TYPES = [
  { key: "", label: "None" }, { key: "reactivation", label: "Reactivation" },
  { key: "hot_lead", label: "Hot Lead" }, { key: "backend", label: "Backend" }, { key: "combo", label: "Combo" },
];

const CHECKLIST = [
  { key: "intakeFormSent", label: "Intake Form Sent" }, { key: "intakeFormComplete", label: "Intake Form Complete" },
  { key: "complianceReviewed", label: "Compliance Reviewed" }, { key: "complianceApproved", label: "Compliance Approved" },
  { key: "accountsChecklist", label: "Accounts Set Up (Twilio/VAPI/Make)" },
  { key: "kickoffScheduled", label: "Kickoff Scheduled" }, { key: "kickoffDone", label: "Kickoff Done" },
  { key: "buildComplete", label: "Build Complete" }, { key: "testingComplete", label: "Testing Complete" },
  { key: "softLaunchDone", label: "Soft Launch Done" },
];

function toDate(val: string | Date | null | undefined) { return val ? String(val).split("T")[0] : ""; }

export default function ClientModal({ client, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    businessName: client?.businessName ?? "", email: client?.email ?? "", systemType: client?.systemType ?? "",
    contactId: client?.contactId ?? "", dealId: client?.dealId ?? "",
    onboardingStatus: client?.onboardingStatus ?? "pending",
    monthlyRetainer: client?.monthlyRetainer?.toString() ?? "",
    goLiveDate: toDate(client?.goLiveDate), nextBillingDate: toDate(client?.nextBillingDate),
    twilioAccountSid: client?.twilioAccountSid ?? "", vapiAssistantId: client?.vapiAssistantId ?? "",
    makeWebhookUrl: client?.makeWebhookUrl ?? "", roiDashboardUrl: client?.roiDashboardUrl ?? "",
    complianceNotes: client?.complianceNotes ?? "", notes: client?.notes ?? "",
    intakeFormSent: client?.intakeFormSent ?? false, intakeFormComplete: client?.intakeFormComplete ?? false,
    complianceReviewed: client?.complianceReviewed ?? false, complianceApproved: client?.complianceApproved ?? false,
    accountsChecklist: client?.accountsChecklist ?? false, kickoffScheduled: client?.kickoffScheduled ?? false,
    kickoffDone: client?.kickoffDone ?? false, buildComplete: client?.buildComplete ?? false,
    testingComplete: client?.testingComplete ?? false, softLaunchDone: client?.softLaunchDone ?? false,
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [saving, setSaving] = useState(false);
  const [sendingIntake, setSendingIntake] = useState(false);
  const [intakeSent, setIntakeSent] = useState(false);
  const [error, setError] = useState("");
  const up = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    Promise.all([
      fetch("/api/contacts?limit=200").then((r) => r.ok ? r.json() : []),
      fetch("/api/deals?limit=200").then((r) => r.ok ? r.json() : []),
    ]).then(([c, d]: [Contact[], Deal[]]) => {
      setContacts(c);
      setDeals(d);
    }).catch(() => {});
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const res = await fetch(client ? `/api/clients/${client.id}` : "/api/clients", {
        method: client ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!client || !confirm("Delete this client?")) return;
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleSendIntake() {
    if (!form.email) { setError("Add an email address before sending the intake form."); return; }
    setSendingIntake(true); setError("");
    try {
      const res = await fetch("/api/send-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEmail: form.email, clientName: form.businessName, clientId: client?.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      setIntakeSent(true);
      up("intakeFormSent", true);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to send intake form"); }
    finally { setSendingIntake(false); }
  }

  const completedCount = CHECKLIST.filter(({ key }) => form[key as keyof typeof form]).length;

  const modal = (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-scale-in" style={panel}>
        {/* Fixed header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{client ? "Edit Client" : "New Client"}</h2>
            <p style={subtitleStyle}>{client ? `Onboarding: ${completedCount}/${CHECKLIST.length} steps` : "Add to onboarding"}</p>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Scrollable body */}
          <div style={bodyStyle}>
            <Field label="Business Name" value={form.businessName} onChange={(v) => up("businessName", v)} required />

            <div style={grid2}>
              <div>
                <label style={labelStyle}>Linked Contact</label>
                <select value={form.contactId} onChange={(e) => up("contactId", e.target.value)} style={selectStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <option value="">— None —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.company ? ` · ${c.company}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Linked Deal</label>
                <select value={form.dealId} onChange={(e) => up("dealId", e.target.value)} style={selectStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <option value="">— None —</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>{d.title} · {d.stage.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Field label="Client Email" value={form.email} onChange={(v) => up("email", v)} type="email" />
              </div>
              <button
                type="button"
                onClick={handleSendIntake}
                disabled={sendingIntake}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 12, background: intakeSent ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))", border: `1px solid ${intakeSent ? "rgba(34,197,94,0.3)" : "rgba(99,102,241,0.3)"}`, color: intakeSent ? "#86efac" : "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: sendingIntake ? "default" : "pointer", opacity: sendingIntake ? 0.7 : 1, whiteSpace: "nowrap" }}
              >
                <Send size={13} />
                {sendingIntake ? "Sending..." : intakeSent ? "Sent!" : "Send Intake Form"}
              </button>
            </div>

            <div style={grid2}>
              <SelectF label="System Type" value={form.systemType} onChange={(v) => up("systemType", v)} options={SYSTEM_TYPES} />
              <SelectF label="Onboarding Status" value={form.onboardingStatus} onChange={(v) => up("onboardingStatus", v)} options={ONBOARDING_STATUSES} />
            </div>
            <div style={grid2}>
              <Field label="Monthly Retainer ($)" value={form.monthlyRetainer} onChange={(v) => up("monthlyRetainer", v)} type="number" />
              <Field label="Go-Live Date" value={form.goLiveDate} onChange={(v) => up("goLiveDate", v)} type="date" />
            </div>

            <div>
              <p style={sectionLabel}>Onboarding Checklist</p>
              <div style={grid2}>
                {CHECKLIST.map(({ key, label }) => {
                  const checked = Boolean(form[key as keyof typeof form]);
                  return (
                    <button key={key} type="button" onClick={() => up(key, !checked)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: checked ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${checked ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", textAlign: "left", transition: "all 0.12s ease" }}>
                      <div style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, background: checked ? "#22c55e" : "rgba(255,255,255,0.06)", border: `1px solid ${checked ? "#22c55e" : "rgba(255,255,255,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {checked && <Check size={10} color="white" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 12, color: checked ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)", fontWeight: checked ? 500 : 400 }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p style={sectionLabel}>Platform Details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label="Twilio Account SID" value={form.twilioAccountSid} onChange={(v) => up("twilioAccountSid", v)} />
                <Field label="VAPI Assistant ID" value={form.vapiAssistantId} onChange={(v) => up("vapiAssistantId", v)} />
                <Field label="Make Webhook URL" value={form.makeWebhookUrl} onChange={(v) => up("makeWebhookUrl", v)} />
                <Field label="ROI Dashboard URL" value={form.roiDashboardUrl} onChange={(v) => up("roiDashboardUrl", v)} />
              </div>
            </div>

            <div>
              <p style={sectionLabel}>Billing</p>
              <Field label="Next Billing Date" value={form.nextBillingDate} onChange={(v) => up("nextBillingDate", v)} type="date" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>Compliance Notes</label>
                <textarea value={form.complianceNotes} onChange={(e) => up("complianceNotes", e.target.value)} rows={2} style={textareaStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={2} style={textareaStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {error && <p style={errorStyle}>{error}</p>}
          </div>

          {/* Fixed footer */}
          <div style={footerStyle}>
            {client && <button type="button" onClick={handleDelete} style={deleteBtn}>Delete</button>}
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...saveBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : client ? "Save Changes" : "Add Client"}
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
const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none" };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical", lineHeight: 1.6 };
const deleteBtn: React.CSSProperties = { padding: "10px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const cancelBtn: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const saveBtn: React.CSSProperties = { flex: 2, padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10 };
