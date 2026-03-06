"use client";

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
  note:    { icon: <FileText size={13} />,    color: "#a5b4fc", bg: "rgba(99,102,241,0.15)" },
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
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
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
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="glass-strong animate-scale-in" style={{ width: "100%", maxWidth: 460, padding: 28 }}>
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Log Activity</h2>
              <p style={{ fontSize: 11, color: "rgba(99,102,241,0.7)", marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>Record an interaction</p>
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="modal-label">Type</label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {Object.keys(TYPE_CONFIG).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid", borderColor: form.type === t ? TYPE_CONFIG[t].color : "rgba(255,255,255,0.08)", background: form.type === t ? TYPE_CONFIG[t].bg : "rgba(255,255,255,0.03)", color: form.type === t ? TYPE_CONFIG[t].color : "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.12s ease" }}
                    >
                      {TYPE_CONFIG[t].icon} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="modal-label">Title <span style={{ color: "#f87171" }}>*</span></label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="modal-input" />
              </div>
              <div>
                <label className="modal-label">Notes</label>
                <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={3} className="modal-textarea" />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModalOpen(false)} className="modal-btn-cancel">Cancel</button>
                <button type="submit" disabled={saving} className="modal-btn-save">
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
