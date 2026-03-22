
import { useState } from "react";
import { Plus, Search, Mail, Phone, MoreHorizontal, User, Send, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ContactModal from "@/components/crm/ContactModal";
import SendEmailModal from "@/components/crm/SendEmailModal";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  type: string;
  createdAt: string | Date;
}

const typeColors: Record<string, string> = {
  lead: "pill-new",
  prospect: "pill-contacted",
  client: "pill-won",
  partner: "pill-proposal",
};

export default function ContactsClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [emailTarget, setEmailTarget] = useState<Contact | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)));
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} contact${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    await Promise.all(Array.from(selected).map((id) => fetch(`/api/contacts/${id}`, { method: "DELETE" }).catch(() => {})));
    setSelected(new Set());
    load();
  }

  async function load() {
    const res = await fetch("/api/contacts");
    if (res.ok) setContacts(await res.json());
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Contacts</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>{contacts.length} total contacts</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          <Plus size={15} /> Add Contact
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          style={{ width: "100%", maxWidth: "100%", padding: "9px 14px 9px 34px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }}
        />
      </div>

      <div className="glass" style={{ overflowX: "auto" }}>
        <table className="mobile-card-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th style={{ padding: "12px 12px 12px 16px", width: 36 }}>
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} style={{ accentColor: "#22C55E", width: 14, height: 14, cursor: "pointer" }} />
              </th>
              {["Name", "Company", "Email", "Phone", "Title", "Type", "Added", ""].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <User size={28} color="rgba(255,255,255,0.15)" />
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                      {search ? "No contacts match your search" : "No contacts yet. Add your first one."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((contact, i) => {
              const isSelected = selected.has(contact.id);
              return (
              <tr
                key={contact.id}
                className="row-hover"
                onClick={() => { setEditing(contact); setModalOpen(true); }}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", background: isSelected ? "rgba(22,163,74,0.07)" : undefined }}
              >
                <td data-label="" style={{ padding: "12px 12px 12px 16px" }} onClick={(e) => toggleSelect(contact.id, e)}>
                  <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ accentColor: "#22C55E", width: 14, height: 14, cursor: "pointer" }} />
                </td>
                <td data-label="Name" style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #16A34A, #22C55E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "white", flexShrink: 0 }}>
                      {contact.firstName[0]}{contact.lastName[0]}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "white" }}>{contact.firstName} {contact.lastName}</span>
                  </div>
                </td>
                <td data-label="Company" style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{contact.company ?? "—"}</td>
                <td data-label="Email" style={{ padding: "12px 16px" }}>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
                      <Mail size={12} /> {contact.email}
                    </a>
                  ) : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>—</span>}
                </td>
                <td data-label="Phone" style={{ padding: "12px 16px" }}>
                  {contact.phone ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                      <Phone size={12} /> {contact.phone}
                    </span>
                  ) : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>—</span>}
                </td>
                <td data-label="Title" style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{contact.title ?? "—"}</td>
                <td data-label="Type" style={{ padding: "12px 16px" }}>
                  <span className={`pill ${typeColors[contact.type] ?? "pill-new"}`}>{contact.type}</span>
                </td>
                <td data-label="Added" style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                </td>
                <td data-label="" style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {contact.email && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEmailTarget(contact); }}
                        title="Send email"
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
                      >
                        <Send size={14} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setEditing(contact); setModalOpen(true); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}>
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ══ BULK ACTION BAR ══ */}
      {selected.size > 0 && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "rgba(10,18,8,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 16, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.55)", zIndex: 200 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{selected.size} selected</span>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />
          <button onClick={bulkDelete} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            <Trash2 size={12} /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} style={{ display: "flex", alignItems: "center", padding: "6px", borderRadius: 8, background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {modalOpen && (
        <ContactModal
          contact={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
      {emailTarget && (
        <SendEmailModal
          contact={emailTarget}
          onClose={() => setEmailTarget(null)}
        />
      )}
    </div>
  );
}
