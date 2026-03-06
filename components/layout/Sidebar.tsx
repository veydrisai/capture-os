"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Zap,
  TrendingUp,
  Calendar,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",   label: "Overview",  icon: LayoutDashboard },
  { href: "/contacts",    label: "Contacts",  icon: Users },
  { href: "/leads",       label: "Leads",     icon: Zap },
  { href: "/deals",       label: "Deals",     icon: TrendingUp },
  { href: "/calendar",    label: "Calendar",  icon: Calendar },
  { href: "/activity",    label: "Activity",  icon: Activity },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="glass-sidebar"
      style={{
        width: 220,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "4px 8px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" fill="white" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "white" }}>
            CaptureOS
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: active ? 500 : 400,
                color: active ? "white" : "rgba(255,255,255,0.45)",
                background: active ? "rgba(99,102,241,0.15)" : "transparent",
                border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
                backdropFilter: active ? "blur(8px)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)";
                }
              }}
            >
              <Icon size={15} />
              {label}
              {active && (
                <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        <Link
          href="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 10,
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)";
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)";
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          <Settings size={14} />
          Settings
        </Link>

        {/* User + Logout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            marginTop: 4,
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? ""}
              style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "white",
                flexShrink: 0,
              }}
            >
              {initials(user.name ?? user.email ?? "?")}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name ?? user.email}
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Admin
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.8)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
