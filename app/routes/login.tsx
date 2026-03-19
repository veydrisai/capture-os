import { useState } from "react";
import { Link } from "react-router";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img src="/logo.svg" alt="CaptureOS" style={{ display: "block", margin: "0 auto 20px", width: 56, height: 56, borderRadius: 18, objectFit: "contain", boxShadow: "0 8px 32px rgba(168,255,71,0.3)" }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", letterSpacing: "-0.04em", marginBottom: 8 }}>CaptureOS</h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14 }}>Your team&apos;s command center</p>
        </div>

        <div className="glass-strong animate-scale-in" style={{ padding: "32px 28px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "white", letterSpacing: "-0.03em", marginBottom: 6 }}>Welcome back</h2>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginBottom: 28 }}>Sign in with your Google account to continue</p>

          <Link
            to="/auth/google"
            onClick={() => setLoading(true)}
            className="glass-btn"
            style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: loading ? 0.7 : 1, textDecoration: "none" }}
          >
            {loading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {loading ? "Signing in..." : "Continue with Google"}
          </Link>

          <p style={{ marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6 }}>
            Access is restricted to authorized team members only.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
