"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, Zap, TrendingUp,
  Calendar, Activity, Settings, LogOut,
  Building2, BookOpen,
} from "lucide-react";
import { initials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",  label: "Overview",  icon: LayoutDashboard },
  { href: "/contacts",   label: "Contacts",  icon: Users },
  { href: "/leads",      label: "Leads",     icon: Zap },
  { href: "/deals",      label: "Pipeline",  icon: TrendingUp },
  { href: "/clients",    label: "Clients",   icon: Building2 },
  { href: "/calendar",   label: "Calendar",  icon: Calendar },
  { href: "/activity",   label: "Activity",  icon: Activity },
  { href: "/playbook",   label: "Playbook",  icon: BookOpen },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="glass-sidebar"
      style={{ width: 224, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, display: "flex", flexDirection: "column", padding: "20px 10px" }}
    >
      {/* Logo */}
      <div style={{ padding: "6px 10px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(99,102,241,0.45),inset 0 1px 0 rgba(255,255,255,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" fill="white" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "white", display: "block" }}>
              CaptureOS
            </span>
            <span style={{ fontSize: 10, color: "rgba(99,102,241,0.7)", fontWeight: 500, letterSpacing: "0.03em" }}>
              RevenueCaptureSystem
            </span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 10px", marginBottom: 6 }}>
        Workspace
      </p>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={active ? undefined : "nav-link"}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 12px", borderRadius: 11,
                fontSize: 13.5, fontWeight: active ? 500 : 400,
                color: active ? "white" : "rgba(255,255,255,0.45)",
                background: active ? "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))" : "transparent",
                border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                textDecoration: "none",
                transition: "background 0.12s ease, color 0.12s ease",
                boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.1),0 2px 8px rgba(99,102,241,0.15)" : "none",
              }}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
              {active && (
                <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 6px rgba(99,102,241,0.8)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
        <Link
          href="/settings"
          prefetch
          className="nav-link"
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none", border: "1px solid transparent" }}
        >
          <Settings size={14} strokeWidth={1.8} />
          Settings
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", marginTop: 2, borderRadius: 12, background: "linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)" }}>
          {user?.image ? (
            <img src={user.image} alt={user.name ?? ""} style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.15)" }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "white", flexShrink: 0 }}>
              {initials(user?.name ?? user?.email ?? "?")}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name ?? user?.email}
            </p>
            <p style={{ fontSize: 10, color: "rgba(99,102,241,0.8)", fontWeight: 500 }}>Admin</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="icon-btn"
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
