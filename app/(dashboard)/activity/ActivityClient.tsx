
import { useState } from "react";
import { Plus, FileText, Phone, Mail, Users, CheckSquare } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  title: string;
  body: string | null;
  completed: boolean;
  scheduledAt: string | Date | null;
  createdAt: string | Date;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  note:    { icon: <FileText size={13} />,    color: "#a5b4fc", bg: "rgba(22,163,74,0.15)" },
  call:    { icon: <Phone size={13} />,       color: "#67e8f9", bg: "rgba(6,182,212,0.15)" },
  email:   { icon: <Mail size={13} />,        color: "#86efac", bg: "rgba(34,197,94,0.15)" },
  meeting: { icon: <Users size={13} />,       color: "#fcd34d", bg: "rgba(245,158,11,0.15)" },
  task:    { icon: <CheckSquare size={13} />, color: "#fdba74", bg: "rgba(249,115,22,0.15)" },
};

export default function ActivityClient({ initialActivities }: { initialActivities: Activity[] }) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: "note", title: "", body: "", scheduledAt: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/activities");
    if (res.ok) setActivities(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ type: "note", title: "", body: "", scheduledAt: "" });
    load();
  }

  const grouped: Record<string, Activity[]> = {};
  activities.forEach((a) => {
    const d = new Date(a.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(a);
  });

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Activity</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>{activities.length} entries</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          <Plus size={15} /> Log Activity
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No activity logged yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {Object.entries(grouped).map(([date, acts]) => (
            <div key={date}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
                {date}
              </p>
              <div className="glass" style={{ overflow: "hidden" }}>
                {acts.map((act, i) => {
                  const cfg = TYPE_CONFIG[act.type] ?? TYPE_CONFIG.note;
                  return (
                    <div
                      key={act.id}
                      style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderBottom: i < acts.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0, marginTop: 1 }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: act.body ? 4 : 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "white" }}>{act.title}</p>
                          <span style={{ fontSize: 10, color: cfg.color, background: cfg.bg, padding: "1px 7px", borderRadius: 999 }}>
                            {act.type}
                          </span>
                        </div>
                        {act.body && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{act.body}</p>}
                        {act.scheduledAt && (
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
                            Scheduled: {new Date(act.scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                        {new Date(act.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div style={panel}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>Log Activity</h2>
              <p style={modalSubtitle}>Record an interaction</p>
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14, padding: 24 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {Object.keys(TYPE_CONFIG).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid", borderColor: form.type === t ? TYPE_CONFIG[t].color : "rgba(255,255,255,0.08)", background: form.type === t ? TYPE_CONFIG[t].bg : "rgba(255,255,255,0.03)", color: form.type === t ? TYPE_CONFIG[t].color : "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.12s ease", fontFamily: "inherit" }}
                    >
                      {TYPE_CONFIG[t].icon} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Title <span style={{ color: "#f87171" }}>*</span></label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(22,163,74,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={3} style={textareaStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(22,163,74,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={cancelBtn}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...saveBtn, opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : "Log Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px 24px 24px 248px" };
const panel: React.CSSProperties = { width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", background: "#0f0d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)" };
const modalHeader: React.CSSProperties = { padding: "24px 24px 0" };
const modalTitle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "-0.03em", marginBottom: 3 };
const modalSubtitle: React.CSSProperties = { fontSize: 12, color: "rgba(22,163,74,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical", lineHeight: 1.6 };
const cancelBtn: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" };
const saveBtn: React.CSSProperties = { flex: 2, padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "white", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.35)" };
