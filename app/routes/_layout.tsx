import { Outlet, redirect, useNavigation } from "react-router";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { getSession } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) return redirect("/login");
  return {
    user: {
      name: (session.get("userName") ?? null) as string | null,
      email: (session.get("userEmail") ?? null) as string | null,
      image: (session.get("userImage") ?? null) as string | null,
    },
  };
}

export default function DashboardLayout({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) {
  const data = loaderData as { user: { name: string | null; email: string | null; image: string | null } };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  // Progress bar: "idle" | "active" | "done"
  const [progressState, setProgressState] = useState<"idle" | "active" | "done">("idle");
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (doneTimer.current) clearTimeout(doneTimer.current);

    if (isLoading) {
      setProgressState("active");
    } else if (progressState === "active") {
      // Flash to "done" briefly so the bar completes before hiding
      setProgressState("done");
      doneTimer.current = setTimeout(() => setProgressState("idle"), 300);
    }

    return () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, [isLoading]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Navigation progress bar */}
      <div className={`nav-progress${progressState !== "idle" ? ` ${progressState}` : ""}`}>
        {progressState !== "idle" && <div className="nav-progress-bar" key={String(isLoading)} />}
      </div>

      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? " is-open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        user={data.user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="app-main">
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", borderRadius: 8 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(99,102,241,0.4)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" fill="white" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "white" }}>CaptureOS</span>
          </div>
          <div style={{ width: 32 }} />
        </div>

        <div className={`outlet-wrap${isLoading ? " loading" : ""}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
