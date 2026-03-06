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
    if (!contact) return;
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-strong"
        style={{ width: "100%", maxWidth: 480, padding: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", letterSpacing: "-0.02em" }}>
            {contact ? "Edit Contact" : "New Contact"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
          >
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
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "white",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
              <option value="partner">Partner</option>
            </select>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#fca5a5", padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {contact && (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#fca5a5",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "9px 16px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2,
                padding: "9px 16px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : contact ? "Save Changes" : "Create Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
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
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
          color: "white",
          fontSize: 13,
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
      />
    </div>
  );
}
