"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from "date-fns";

interface GCalEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
  description?: string;
  location?: string;
  colorId?: string;
}

interface Props {
  accessToken: string | null;
}

const COLORS: Record<string, string> = {
  "1": "#a4bdfc", "2": "#7ae7bf", "3": "#dbadff", "4": "#ff887c",
  "5": "#fbd75b", "6": "#ffb878", "7": "#46d6db", "8": "#e1e1e1",
  "9": "#5484ed", "10": "#51b749", "11": "#dc2127",
};

export default function CalendarClient({ accessToken }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, accessToken]);

  async function fetchEvents() {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      const res = await fetch(
        `/api/calendar?timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}`
      );
      if (!res.ok) throw new Error("Failed to fetch calendar");
      const data = await res.json();
      setEvents(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading calendar");
    } finally {
      setLoading(false);
    }
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayEvents = (day: Date) =>
    events.filter((e) => {
      const d = e.start.dateTime ?? e.start.date ?? "";
      return isSameDay(new Date(d), day);
    });

  const selectedDayEvents = selectedDay ? dayEvents(selectedDay) : [];

  if (!accessToken) {
    return (
      <div className="animate-fade-up">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Calendar</h1>
        </div>
        <div className="glass" style={{ padding: 48, textAlign: "center" }}>
          <Calendar size={40} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 8 }}>
            Google Calendar not connected
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            Sign out and sign back in to grant calendar access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>Calendar</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>
            {format(currentDate, "MMMM yyyy")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, cursor: "pointer" }}
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <ChevronRight size={16} />
          </button>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
          >
            <Plus size={14} /> New Event
          </a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Calendar Grid */}
        <div className="glass" style={{ overflow: "hidden" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {days.map((day, i) => {
              const evs = dayEvents(day);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    minHeight: 80,
                    padding: "8px 10px",
                    borderRight: (i + 1) % 7 !== 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    borderBottom: i < days.length - 7 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: isSelected ? "rgba(99,102,241,0.08)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: today ? 600 : 400,
                      color: today ? "white" : inMonth ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                      background: today ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent",
                      marginBottom: 4,
                    }}
                  >
                    {format(day, "d")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {evs.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          padding: "1px 5px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 500,
                          background: COLORS[ev.colorId ?? ""] ? `${COLORS[ev.colorId!]}22` : "rgba(99,102,241,0.2)",
                          color: COLORS[ev.colorId ?? ""] ?? "#a5b4fc",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ev.summary}
                      </div>
                    ))}
                    {evs.length > 2 && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>+{evs.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {loading && (
            <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              Loading events...
            </div>
          )}
          {error && (
            <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: "#fca5a5", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 16 }}>
            {selectedDay ? format(selectedDay, "EEEE, MMM d") : "Select a day"}
          </h3>

          {!selectedDay && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 32 }}>
              Click a day to see events
            </p>
          )}

          {selectedDay && selectedDayEvents.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Calendar size={28} color="rgba(255,255,255,0.12)" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>No events</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedDayEvents.map((ev) => {
              const startTime = ev.start.dateTime
                ? format(new Date(ev.start.dateTime), "h:mm a")
                : "All day";
              const endTime = ev.end.dateTime
                ? format(new Date(ev.end.dateTime), "h:mm a")
                : "";
              return (
                <a
                  key={ev.id}
                  href={ev.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    padding: "12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "white", lineHeight: 1.4, flex: 1 }}>
                      {ev.summary}
                    </p>
                    <ExternalLink size={11} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0, marginTop: 2 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Clock size={11} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      {startTime}{endTime ? ` – ${endTime}` : ""}
                    </span>
                  </div>
                  {ev.location && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                      📍 {ev.location}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
