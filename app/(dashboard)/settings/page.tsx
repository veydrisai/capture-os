import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Settings</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>Manage your workspace</p>
      </div>

      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Profile */}
        <div className="glass" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 20 }}>Profile</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {user?.image ? (
              <img src={user.image} alt={user.name ?? ""} style={{ width: 56, height: 56, borderRadius: "50%" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: "white" }}>
                {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: "white" }}>{user?.name}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{user?.email}</p>
              <span style={{ fontSize: 11, color: "#a5b4fc", background: "rgba(99,102,241,0.12)", padding: "2px 8px", borderRadius: 6, marginTop: 4, display: "inline-block" }}>
                Admin
              </span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 16 }}>
            Profile managed via Google. Sign out and back in to refresh.
          </p>
        </div>

        {/* Integrations */}
        <div className="glass" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 20 }}>Integrations</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "white" }}>Google Calendar</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Read & display your events</p>
              </div>
            </div>
            <span style={{ fontSize: 11, color: "#86efac", background: "rgba(34,197,94,0.12)", padding: "3px 10px", borderRadius: 6 }}>
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
