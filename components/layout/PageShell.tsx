import React from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PageShell — shared page wrapper for all CRM modules.
 * Provides consistent header, actions row, toolbar (search/filters),
 * and a flex content area that fills remaining vertical space.
 */
export default function PageShell({ title, subtitle, actions, toolbar, children }: PageShellProps) {
  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em", lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
      </div>

      {/* Toolbar row (search, filters, view toggles) */}
      {toolbar && (
        <div style={{ marginBottom: 18, flexShrink: 0 }}>{toolbar}</div>
      )}

      {/* Content — fills remaining height */}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
