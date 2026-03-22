import { useState, useRef } from "react";
import { Plus, Search, List, Columns, Upload, Trash2, X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  MeasuringStrategy,
  pointerWithin,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import LeadModal from "@/components/crm/LeadModal";
import LeadImportModal from "@/components/crm/LeadImportModal";
import PageShell from "@/components/layout/PageShell";
import BoardViewport from "@/components/layout/BoardViewport";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  source: string | null;
  industry: string | null;
  estimatedValue: number;
  systemInterest: string | null;
  notes: string | null;
  createdAt: string | Date;
}

const STAGES = [
  { key: "new",            label: "New",            color: "#4ADE80" },
  { key: "contacted",      label: "Contacted",      color: "#06b6d4" },
  { key: "interested",     label: "Interested",     color: "#a78bfa" },
  { key: "demo_scheduled", label: "Demo Scheduled", color: "#f59e0b" },
  { key: "no_show",        label: "No Show",        color: "#f97316" },
  { key: "not_qualified",  label: "Not Qualified",  color: "#6b7280" },
  { key: "qualified",      label: "Qualified",      color: "#22c55e" },
  { key: "closed",         label: "Closed",         color: "#10b981" },
];

const statusPill: Record<string, { bg: string; color: string; border: string }> = {
  new:            { bg: "rgba(129,140,248,0.12)", color: "#c7d2fe", border: "rgba(129,140,248,0.25)" },
  contacted:      { bg: "rgba(6,182,212,0.12)",   color: "#a5f3fc", border: "rgba(6,182,212,0.25)" },
  interested:     { bg: "rgba(74,222,128,0.12)", color: "#ddd6fe", border: "rgba(74,222,128,0.25)" },
  demo_scheduled: { bg: "rgba(245,158,11,0.12)",  color: "#fde68a", border: "rgba(245,158,11,0.25)" },
  no_show:        { bg: "rgba(249,115,22,0.12)",  color: "#fed7aa", border: "rgba(249,115,22,0.25)" },
  not_qualified:  { bg: "rgba(107,114,128,0.12)", color: "#d1d5db", border: "rgba(107,114,128,0.25)" },
  qualified:      { bg: "rgba(34,197,94,0.12)",   color: "#bbf7d0", border: "rgba(34,197,94,0.25)" },
  closed:         { bg: "rgba(16,185,129,0.12)",  color: "#6ee7b7", border: "rgba(16,185,129,0.25)" },
};

const systemTypeLabel: Record<string, string> = {
  reactivation: "Reactivation", hot_lead: "Hot Lead", backend: "Backend", combo: "Combo",
};

function fullName(l: Lead) { return `${l.firstName} ${l.lastName}`.trim(); }

// ─── Draggable Card ───────────────────────────────────────────────────────────

function DraggableCard({ lead, stageColor, onClick, isSelected, onSelect }: { lead: Lead; stageColor: string; onClick: () => void; isSelected: boolean; onSelect: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{
        position: "relative",
        padding: "12px 13px 10px",
        borderRadius: 12,
        background: isSelected ? "rgba(22,163,74,0.12)" : isDragging ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.04)",
        border: isSelected ? "1px solid rgba(22,163,74,0.45)" : isDragging ? "1px solid rgba(22,163,74,0.4)" : "1px solid rgba(255,255,255,0.07)",
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.4 : 1,
        transition: "background 0.15s, border 0.15s",
        touchAction: "none",
      }}
      onMouseEnter={(e) => {
        if (isDragging) return;
        const el = e.currentTarget as HTMLDivElement;
        if (!isSelected) { el.style.background = "rgba(255,255,255,0.07)"; el.style.borderColor = "rgba(22,163,74,0.3)"; }
      }}
      onMouseLeave={(e) => {
        if (isDragging) return;
        const el = e.currentTarget as HTMLDivElement;
        if (!isSelected) { el.style.background = "rgba(255,255,255,0.04)"; el.style.borderColor = "rgba(255,255,255,0.07)"; }
      }}
    >
      {/* Checkbox — stops drag listeners via stopPropagation */}
      <div
        style={{ position: "absolute", top: 8, right: 8 }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onSelect}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          style={{ accentColor: "#22C55E", width: 13, height: 13, cursor: "pointer" }}
        />
      </div>
      <CardContent lead={lead} stageColor={stageColor} />
    </div>
  );
}

// ─── Card Content (reused in DragOverlay) ────────────────────────────────────

function CardContent({ lead, stageColor }: { lead: Lead; stageColor: string }) {
  return (
    <>
      <p style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 3, lineHeight: 1.35, letterSpacing: "-0.01em" }}>{fullName(lead)}</p>
      {lead.company && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginBottom: 5 }}>{lead.company}</p>}
      {lead.systemInterest && (
        <span style={{ display: "inline-flex", fontSize: 10, fontWeight: 600, color: "rgba(74,222,128,0.85)", background: "rgba(34,197,94,0.1)", padding: "2px 7px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.2)" }}>
          {systemTypeLabel[lead.systemInterest]}
        </span>
      )}
      {lead.estimatedValue > 0 && (
        <p style={{ fontSize: 12, fontWeight: 700, color: stageColor, marginTop: 6 }}>${lead.estimatedValue.toLocaleString()}</p>
      )}
    </>
  );
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({ stage, children, style }: { stage: typeof STAGES[number]; children: React.ReactNode; style?: React.CSSProperties }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        flexDirection: "column",
        background: isOver ? "rgba(22,163,74,0.08)" : "rgba(255,255,255,0.025)",
        border: isOver ? "1px solid rgba(22,163,74,0.35)" : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        overflow: "hidden",
        transition: "background 0.15s, border 0.15s",
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((l) => l.id)));
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} lead${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    await Promise.all(Array.from(selected).map((id) =>
      fetch(`/api/leads/${id}`, { method: "DELETE" }).catch(() => {})
    ));
    setSelected(new Set());
    load();
  }

  async function bulkChangeStatus(status: string) {
    await Promise.all(Array.from(selected).map((id) =>
      fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch(() => {})
    ));
    setSelected(new Set());
    load();
  }

  // Require 5px movement before drag starts — preserves click-to-edit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function load() {
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      setLeads(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // Revert on failure
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: lead.status } : l));
      setError("Failed to move lead — please try again");
    }
  }

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;
  const activeStage = activeLead ? STAGES.find((s) => s.key === activeLead.status) : null;

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return fullName(l).toLowerCase().includes(q) || (l.company ?? "").toLowerCase().includes(q) || (l.email ?? "").toLowerCase().includes(q);
  });

  const viewToggle = (
    <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: 3 }}>
      {(["kanban", "list"] as const).map((v) => (
        <button key={v} onClick={() => setView(v)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: view === v ? "rgba(22,163,74,0.25)" : "transparent", color: view === v ? "white" : "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.15s" }}>
          {v === "kanban" ? <Columns size={14} /> : <List size={14} />}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
          {error}
        </div>
      )}
      <PageShell
        title="Leads"
        subtitle={`${leads.length} total leads`}
        actions={
          <>
            {viewToggle}
            <button onClick={() => setImportOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              <Upload size={15} /> Import CSV
            </button>
            <button onClick={() => { setEditing(null); setModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg, #16A34A, #22C55E)", border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
              <Plus size={15} /> Add Lead
            </button>
          </>
        }
        toolbar={
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, company, email..." style={{ width: "100%", maxWidth: "100%", padding: "9px 14px 9px 34px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, outline: "none" }} />
          </div>
        }
      >
        {/* ══ KANBAN VIEW ══ */}
        {view === "kanban" && (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            autoScroll={{
              enabled: true,
              threshold: { x: 0.15, y: 0.1 },
              interval: 50,
              acceleration: 8,
            }}
          >
            <div ref={boardRef}>
              <BoardViewport columnCount={STAGES.length} minColWidth={200} maxColWidth={320}>
                {STAGES.map((stage) => {
                  const stageLeads = filtered.filter((l) => l.status === stage.key);
                  return (
                    <DroppableColumn key={stage.key} stage={stage}>
                      {/* Lane header */}
                      <div style={{ padding: "13px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color, boxShadow: `0 0 8px ${stage.color}80`, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>{stage.label}</span>
                          <span style={{ fontSize: 10, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", padding: "2px 6px", borderRadius: 999, fontWeight: 500 }}>{stageLeads.length}</span>
                        </div>
                      </div>

                      {/* Lane body */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 8px", display: "flex", flexDirection: "column", gap: 7, scrollbarWidth: "none", minHeight: 120 }}>
                        {stageLeads.length === 0 && (
                          <div style={{ padding: "24px 8px", textAlign: "center", opacity: 0.35 }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px dashed ${stage.color}70`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                              <Plus size={12} color={stage.color} />
                            </div>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Drop here</p>
                          </div>
                        )}

                        {stageLeads.map((lead) => (
                          <DraggableCard
                            key={lead.id}
                            lead={lead}
                            stageColor={stage.color}
                            onClick={() => { setEditing(lead); setModalOpen(true); }}
                            isSelected={selected.has(lead.id)}
                            onSelect={(e) => toggleSelect(lead.id, e)}
                          />
                        ))}

                        <button
                          onClick={() => { setEditing(null); setModalOpen(true); }}
                          style={{ marginTop: 2, padding: "8px", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.09)", background: "transparent", color: "rgba(255,255,255,0.22)", fontSize: 11, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.15s", width: "100%" }}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = `${stage.color}60`; el.style.color = stage.color; el.style.background = `${stage.color}08`; }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.22)"; el.style.background = "transparent"; }}
                        >
                          <Plus size={12} /> Add lead
                        </button>
                      </div>
                    </DroppableColumn>
                  );
                })}
              </BoardViewport>
            </div>

            {/* Drag ghost */}
            <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
              {activeLead && (
                <div style={{ padding: "12px 13px 10px", borderRadius: 12, background: "rgba(22,163,74,0.2)", border: "1px solid rgba(22,163,74,0.5)", boxShadow: "0 8px 32px rgba(22,163,74,0.3)", cursor: "grabbing", width: 220 }}>
                  <CardContent lead={activeLead} stageColor={activeStage?.color ?? "#4ADE80"} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* ══ LIST VIEW ══ */}
        {view === "list" && (
          <div className="glass" style={{ overflowX: "auto" }}>
            <table className="mobile-card-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 660 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ padding: "11px 12px 11px 16px", width: 36 }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                      style={{ accentColor: "#22C55E", width: 14, height: 14, cursor: "pointer" }}
                    />
                  </th>
                  {["Name", "Company", "Status", "System", "Source", "Value", ""].map((h) => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No leads found.</td></tr>
                ) : filtered.map((lead, i) => {
                  const pill = statusPill[lead.status];
                  const isSelected = selected.has(lead.id);
                  return (
                    <tr key={lead.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", background: isSelected ? "rgba(22,163,74,0.07)" : "transparent", transition: "background 0.1s" }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td data-label="" style={{ padding: "11px 12px 11px 16px" }} onClick={(e) => toggleSelect(lead.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ accentColor: "#22C55E", width: 14, height: 14, cursor: "pointer" }}
                        />
                      </td>
                      <td data-label="Name" style={{ padding: "11px 16px" }} onClick={() => { setEditing(lead); setModalOpen(true); }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>{fullName(lead)}</p>
                        {lead.email && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{lead.email}</p>}
                      </td>
                      <td data-label="Company" style={{ padding: "11px 16px", fontSize: 12.5, color: "rgba(255,255,255,0.5)" }} onClick={() => { setEditing(lead); setModalOpen(true); }}>{lead.company ?? "—"}</td>
                      <td data-label="Status" style={{ padding: "11px 16px" }} onClick={() => { setEditing(lead); setModalOpen(true); }}>
                        {pill ? <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: pill.bg, color: pill.color, border: `1px solid ${pill.border}` }}>{lead.status.replace(/_/g, " ")}</span> : lead.status}
                      </td>
                      <td data-label="System" style={{ padding: "11px 16px", fontSize: 12, color: "rgba(74,222,128,0.85)" }} onClick={() => { setEditing(lead); setModalOpen(true); }}>{lead.systemInterest ? systemTypeLabel[lead.systemInterest] : "—"}</td>
                      <td data-label="Source" style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }} onClick={() => { setEditing(lead); setModalOpen(true); }}>{lead.source ?? "—"}</td>
                      <td data-label="Value" style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }} onClick={() => { setEditing(lead); setModalOpen(true); }}>{lead.estimatedValue > 0 ? `$${lead.estimatedValue.toLocaleString()}` : "—"}</td>
                      <td data-label="" style={{ padding: "11px 16px" }} onClick={() => { setEditing(lead); setModalOpen(true); }}><span style={{ fontSize: 12, color: "rgba(22,163,74,0.7)" }}>Edit →</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ══ BULK ACTION BAR ══ */}
        {selected.size > 0 && (
          <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "rgba(10,18,8,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 16, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,197,94,0.08)", zIndex: 200 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{selected.size} selected</span>
            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />
            <select
              defaultValue=""
              onChange={(e) => { if (e.target.value) { bulkChangeStatus(e.target.value); e.target.value = ""; } }}
              style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", fontSize: 12, cursor: "pointer", outline: "none" }}
            >
              <option value="" disabled>Change status…</option>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button onClick={bulkDelete} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              <Trash2 size={12} /> Delete
            </button>
            <button onClick={() => setSelected(new Set())} style={{ display: "flex", alignItems: "center", padding: "6px", borderRadius: 8, background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {modalOpen && <LeadModal lead={editing} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}
        {importOpen && <LeadImportModal onClose={() => setImportOpen(false)} onImported={load} />}
      </PageShell>
    </>
  );
}
