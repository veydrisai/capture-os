"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  type: string;
}

interface Props {
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ContactModal({ contact, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    title: contact?.title ?? "",
    company: contact?.company ?? "",
    type: contact?.type ?? "lead",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const method = contact ? "PATCH" : "POST";
      const url = contact ? `/api/contacts/${contact.id}` : "/api/contacts";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, company: form.company || null }),
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
    if (!contact || !confirm("Delete this contact?")) return;
    await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panel}>
        <div style={header}>
          <div>
            <h2 style={title}>{contact ? "Edit Contact" : "New Contact"}</h2>
            <p style={subtitle}>{contact ? "Update record" : "Add to CRM"}</p>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={form_}>
          <div style={grid2}>
            <Field label="First Name" value={form.firstName} onChange={(v) => update("firstName", v)} required />
            <Field label="Last Name" value={form.lastName} onChange={(v) => update("lastName", v)} required />
          </div>
          <Field label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" />
          <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} type="tel" />
          <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
          <Field label="Title / Role" value={form.title} onChange={(v) => update("title", v)} />

          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.type} onChange={(e) => update("type", e.target.value)} style={selectStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
              <option value="partner">Partner</option>
            </select>
          </div>

          {error && <p style={errorStyle}>{error}</p>}

          <div style={btns}>
            {contact && <button type="button" onClick={handleDelete} style={deleteBtn}>Delete</button>}
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...saveBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : contact ? "Save Changes" : "Create Contact"}
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
      <label style={labelStyle}>{label}{required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        style={inputStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 };
const panel: React.CSSProperties = { width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", background: "#0f0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)" };
const header: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 24px 0" };
const title: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "-0.03em", marginBottom: 3 };
const subtitle: React.CSSProperties = { fontSize: 12, color: "rgba(99,102,241,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" };
const closeBtn: React.CSSProperties = { background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4, marginTop: -2 };
const form_: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 16, padding: 24 };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none" };
const btns: React.CSSProperties = { display: "flex", gap: 10, marginTop: 4 };
const deleteBtn: React.CSSProperties = { padding: "10px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const cancelBtn: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const saveBtn: React.CSSProperties = { flex: 2, padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10 };
