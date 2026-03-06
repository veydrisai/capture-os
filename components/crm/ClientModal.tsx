"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

interface Client {
  id: string;
  businessName: string;
  systemType: string | null;
  onboardingStatus: string;
  intakeFormSent: boolean;
  intakeFormComplete: boolean;
  complianceReviewed: boolean;
  complianceApproved: boolean;
  accountsChecklist: boolean;
  kickoffScheduled: boolean;
  kickoffDone: boolean;
  buildComplete: boolean;
  testingComplete: boolean;
  softLaunchDone: boolean;
  goLiveDate: string | null;
  twilioAccountSid: string | null;
  vapiAssistantId: string | null;
  makeWebhookUrl: string | null;
  roiDashboardUrl: string | null;
  monthlyRetainer: number;
  nextBillingDate: string | null;
  complianceNotes: string | null;
  notes: string | null;
}

interface Props {
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}

const ONBOARDING_STATUSES = [
  { key: "pending",             label: "Pending" },
  { key: "intake_sent",         label: "Intake Sent" },
  { key: "intake_complete",     label: "Intake Complete" },
  { key: "compliance_review",   label: "Compliance Review" },
  { key: "compliance_approved", label: "Compliance Approved" },
  { key: "building",            label: "Building" },
  { key: "testing",             label: "Testing" },
  { key: "soft_launch",         label: "Soft Launch" },
  { key: "live",                label: "Live" },
];

const SYSTEM_TYPES = [
  { key: "", label: "None" },
  { key: "reactivation", label: "Reactivation" },
  { key: "hot_lead",     label: "Hot Lead" },
  { key: "backend",      label: "Backend" },
  { key: "combo",        label: "Combo" },
];

const CHECKLIST = [
  { key: "intakeFormSent",      label: "Intake Form Sent" },
  { key: "intakeFormComplete",  label: "Intake Form Complete" },
  { key: "complianceReviewed",  label: "Compliance Reviewed" },
  { key: "complianceApproved",  label: "Compliance Approved" },
  { key: "accountsChecklist",   label: "Accounts Set Up (Twilio/VAPI/Make)" },
  { key: "kickoffScheduled",    label: "Kickoff Scheduled" },
  { key: "kickoffDone",         label: "Kickoff Done" },
  { key: "buildComplete",       label: "Build Complete" },
  { key: "testingComplete",     label: "Testing Complete" },
  { key: "softLaunchDone",      label: "Soft Launch Done" },
];

function toDateInput(val: string | null | undefined) {
  if (!val) return "";
  return String(val).split("T")[0];
}

export default function ClientModal({ client, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    businessName: client?.businessName ?? "",
    systemType: client?.systemType ?? "",
    onboardingStatus: client?.onboardingStatus ?? "pending",
    monthlyRetainer: client?.monthlyRetainer?.toString() ?? "",
    goLiveDate: toDateInput(client?.goLiveDate),
    nextBillingDate: toDateInput(client?.nextBillingDate),
    twilioAccountSid: client?.twilioAccountSid ?? "",
    vapiAssistantId: client?.vapiAssistantId ?? "",
    makeWebhookUrl: client?.makeWebhookUrl ?? "",
    roiDashboardUrl: client?.roiDashboardUrl ?? "",
    complianceNotes: client?.complianceNotes ?? "",
    notes: client?.notes ?? "",
    intakeFormSent: client?.intakeFormSent ?? false,
    intakeFormComplete: client?.intakeFormComplete ?? false,
    complianceReviewed: client?.complianceReviewed ?? false,
    complianceApproved: client?.complianceApproved ?? false,
    accountsChecklist: client?.accountsChecklist ?? false,
    kickoffScheduled: client?.kickoffScheduled ?? false,
    kickoffDone: client?.kickoffDone ?? false,
    buildComplete: client?.buildComplete ?? false,
    testingComplete: client?.testingComplete ?? false,
    softLaunchDone: client?.softLaunchDone ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const up = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const method = client ? "PATCH" : "POST";
      const url = client ? `/api/clients/${client.id}` : "/api/clients";
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
    if (!client || !confirm("Delete this client?")) return;
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    onSaved();
  }

  const completedCount = CHECKLIST.filter(({ key }) => form[key as keyof typeof form]).length;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-strong animate-scale-in" style={{ width: "100%", maxWidth: 620, maxHeight: "92vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>
              {client ? "Edit Client" : "New Client"}
            </h2>
            <p style={{ fontSize: 11, color: "rgba(99,102,241,0.7)", marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
              {client ? `Onboarding: ${completedCount}/${CHECKLIST.length} steps` : "Add to onboarding"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Basic info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Business Name" value={form.businessName} onChange={(v) => up("businessName", v)} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="modal-label">System Type</label>
                <select value={form.systemType} onChange={(e) => up("systemType", e.target.value)} className="modal-select">
                  {SYSTEM_TYPES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="modal-label">Onboarding Status</label>
                <select value={form.onboardingStatus} onChange={(e) => up("onboardingStatus", e.target.value)} className="modal-select">
                  {ONBOARDING_STATUSES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Monthly Retainer ($)" value={form.monthlyRetainer} onChange={(v) => up("monthlyRetainer", v)} type="number" />
              <Field label="Go-Live Date" value={form.goLiveDate} onChange={(v) => up("goLiveDate", v)} type="date" />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <p className="modal-section">Onboarding Checklist</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CHECKLIST.map(({ key, label }) => {
                const checked = Boolean(form[key as keyof typeof form]);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => up(key, !checked)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 11,
                      background: checked ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${checked ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.07)"}`,
                      cursor: "pointer", textAlign: "left",
                      transition: "background 0.12s ease, border-color 0.12s ease",
                    }}
                  >
                    <div style={{
                      width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                      background: checked ? "#22c55e" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${checked ? "#22c55e" : "rgba(255,255,255,0.12)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {checked && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 12, color: checked ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)", fontWeight: checked ? 500 : 400 }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform Details */}
          <div>
            <p className="modal-section">Platform Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label="Twilio Account SID" value={form.twilioAccountSid} onChange={(v) => up("twilioAccountSid", v)} />
              <Field label="VAPI Assistant ID" value={form.vapiAssistantId} onChange={(v) => up("vapiAssistantId", v)} />
              <Field label="Make Webhook URL" value={form.makeWebhookUrl} onChange={(v) => up("makeWebhookUrl", v)} />
              <Field label="ROI Dashboard URL" value={form.roiDashboardUrl} onChange={(v) => up("roiDashboardUrl", v)} />
            </div>
          </div>

          {/* Billing */}
          <div>
            <p className="modal-section">Billing</p>
            <Field label="Next Billing Date" value={form.nextBillingDate} onChange={(v) => up("nextBillingDate", v)} type="date" />
          </div>

          {/* Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label className="modal-label">Compliance Notes</label>
              <textarea value={form.complianceNotes} onChange={(e) => up("complianceNotes", e.target.value)} rows={2} className="modal-textarea" />
            </div>
            <div>
              <label className="modal-label">Notes</label>
              <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={2} className="modal-textarea" />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {client && <button type="button" onClick={handleDelete} className="modal-btn-delete">Delete</button>}
            <button type="button" onClick={onClose} className="modal-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving} className="modal-btn-save">
              {saving ? "Saving..." : client ? "Save Changes" : "Add Client"}
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
