import { useState } from "react";
import { Save } from "lucide-react";

interface Props {
  user: { name: string; email: string; image: string | null };
  initialSettings: {
    makeWebhookUrl: string;
    n8nWebhookUrl: string;
    agreementTemplateUrl: string;
    intakeFormUrl: string;
    internalEmail: string;
  };
}

export default function SettingsClient({ user, initialSettings }: Props) {
  const [ws, setWs] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetch("/api/workspace-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ws),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Settings</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>Manage your workspace</p>
      </div>

      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 20 }}>Profile</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {user?.image ? (
              <img src={user.image} alt={user.name ?? ""} style={{ width: 56, height: 56, borderRadius: "50%" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: "white" }}>
                {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: "white" }}>{user?.name}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{user?.email}</p>
              <span style={{ fontSize: 11, color: "#a5b4fc", background: "rgba(124,58,237,0.12)", padding: "2px 8px", borderRadius: 6, marginTop: 4, display: "inline-block" }}>Admin</span>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 20 }}>Workspace</h2>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SettingField
              label="Internal Notification Email"
              hint="Your team email — receives alerts when deals move stages, agreements are sent, clients go live, etc."
              value={ws.internalEmail}
              onChange={(v) => setWs((s) => ({ ...s, internalEmail: v }))}
              placeholder="team@youragency.com"
            />
            <SettingField
              label="n8n Webhook Base URL"
              hint="Base URL only — no trailing slash or path (e.g. https://n8n.yourdomain.com/webhook). CaptureOS appends the event path automatically."
              value={ws.n8nWebhookUrl}
              onChange={(v) => setWs((s) => ({ ...s, n8nWebhookUrl: v }))}
              placeholder="https://n8n.yourdomain.com/webhook"
            />
            <SettingField
              label="Agreement Template URL"
              hint="DocuSign or PandaDoc link — auto-sent to prospects when demo is marked done"
              value={ws.agreementTemplateUrl}
              onChange={(v) => setWs((s) => ({ ...s, agreementTemplateUrl: v }))}
              placeholder="https://app.pandadoc.com/..."
            />
            <SettingField
              label="Intake Form URL"
              hint="Google Form or Typeform — auto-sent to new clients when agreement is signed"
              value={ws.intakeFormUrl}
              onChange={(v) => setWs((s) => ({ ...s, intakeFormUrl: v }))}
              placeholder="https://forms.gle/..."
            />
            <SettingField
              label="Make.com Webhook URL"
              hint="Legacy Make.com webhook — kept for backwards compatibility"
              value={ws.makeWebhookUrl}
              onChange={(v) => setWs((s) => ({ ...s, makeWebhookUrl: v }))}
              placeholder="https://hook.us1.make.com/..."
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
              <button type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #A855F7)", border: "none", color: "white", fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                <Save size={13} /> {saving ? "Saving..." : "Save Settings"}
              </button>
              {saved && <span style={{ fontSize: 12, color: "#86efac" }}>Saved ✓</span>}
              {saveError && <span style={{ fontSize: 12, color: "#fca5a5" }}>{saveError}</span>}
            </div>
          </form>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 20 }}>Integrations</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="#111827"/>
                    <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm.5-9.5h-1.25v4.5l3.97 2.38.63-1.03-3.35-1.99V8.5z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "white" }}>Cal.com</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Booking calendar — displays upcoming calls</p>
                </div>
              </div>
              <a href="https://app.cal.com/settings/developer/api-keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#a5b4fc", background: "rgba(124,58,237,0.1)", padding: "3px 10px", borderRadius: 6, textDecoration: "none" }}>
                Get API key →
              </a>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="#111827"/>
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "white" }}>Resend</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Transactional email — lead alerts from noreply@captureos.app</p>
                </div>
              </div>
              <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#a5b4fc", background: "rgba(124,58,237,0.1)", padding: "3px 10px", borderRadius: 6, textDecoration: "none" }}>
                Get API key →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingField({ label, hint, value, onChange, placeholder }: { label: string; hint: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>{label}</label>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 7 }}>{hint}</p>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
      />
    </div>
  );
}
