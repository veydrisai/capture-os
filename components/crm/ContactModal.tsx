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
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-strong animate-scale-in" style={{ width: "100%", maxWidth: 480, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>
              {contact ? "Edit Contact" : "New Contact"}
            </h2>
            <p style={{ fontSize: 11, color: "rgba(99,102,241,0.7)", marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
              {contact ? "Update record" : "Add to CRM"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="First Name" value={form.firstName} onChange={(v) => update("firstName", v)} required />
            <Field label="Last Name" value={form.lastName} onChange={(v) => update("lastName", v)} required />
          </div>
          <Field label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" />
          <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} type="tel" />
          <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
          <Field label="Title / Role" value={form.title} onChange={(v) => update("title", v)} />

          <div>
            <label className="modal-label">Type</label>
            <select value={form.type} onChange={(e) => update("type", e.target.value)} className="modal-select">
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
              <option value="partner">Partner</option>
            </select>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#fca5a5", padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {contact && <button type="button" onClick={handleDelete} className="modal-btn-delete">Delete</button>}
            <button type="button" onClick={onClose} className="modal-btn-cancel">Cancel</button>
            <button type="submit" disabled={saving} className="modal-btn-save">
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
      <label className="modal-label">{label} {required && <span style={{ color: "#f87171" }}>*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="modal-input" />
    </div>
  );
}
