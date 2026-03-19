
import { useState } from "react";
import { Plus, Search, Mail, Phone, MoreHorizontal, User, Send } from "lucide-react";
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Contacts</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>{contacts.length} total contacts</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
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
          style={{ width: "100%", maxWidth: 360, padding: "9px 14px 9px 34px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }}
        />
      </div>

      <div className="glass" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Name", "Company", "Email", "Phone", "Title", "Type", "Added", ""].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <User size={28} color="rgba(255,255,255,0.15)" />
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                      {search ? "No contacts match your search" : "No contacts yet. Add your first one."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((contact, i) => (
              <tr
                key={contact.id}
                className="row-hover"
                onClick={() => { setEditing(contact); setModalOpen(true); }}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "white", flexShrink: 0 }}>
                      {contact.firstName[0]}{contact.lastName[0]}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "white" }}>{contact.firstName} {contact.lastName}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{contact.company ?? "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
                      <Mail size={12} /> {contact.email}
                    </a>
                  ) : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {contact.phone ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                      <Phone size={12} /> {contact.phone}
                    </span>
                  ) : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{contact.title ?? "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span className={`pill ${typeColors[contact.type] ?? "pill-new"}`}>{contact.type}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                </td>
                <td style={{ padding: "12px 16px" }}>
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
            ))}
          </tbody>
        </table>
      </div>

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
