"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";
import PageShell from "@/components/layout/PageShell";

interface CalBooking {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  attendees: Array<{ name: string; email: string }>;
  description?: string;
  location?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "#6ee7b7",
  PENDING: "#fbbf24",
  CANCELLED: "#fca5a5",
  REJECTED: "#fca5a5",
};

export default function CalendarClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  async function fetchBookings() {
    setLoading(true);
    setError("");
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      const res = await fetch(
        `/api/calendar?timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch bookings");
      setBookings(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading bookings");
    } finally {
      setLoading(false);
    }
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayBookings = (day: Date) =>
    bookings.filter((b) => isSameDay(new Date(b.startTime), day));

  const selectedDayBookings = selectedDay ? dayBookings(selectedDay) : [];

  const navActions = (
    <>
      <button
        data-testid="prev-month"
        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
        style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        data-testid="today-btn"
        onClick={() => setCurrentDate(new Date())}
        style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", fontSize: 13, cursor: "pointer" }}
      >
        Today
      </button>
      <button
        data-testid="next-month"
        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
        style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <ChevronRight size={16} />
      </button>
      <a
        href="https://app.cal.com/bookings/upcoming"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "white", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
      >
        <ExternalLink size={14} /> Cal.com
      </a>
    </>
  );

  return (
    <PageShell title="Calendar" subtitle={format(currentDate, "MMMM yyyy")} actions={navActions} data-testid="calendar-page">
      {error && (
        <div data-testid="calendar-error" style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#fca5a5", margin: 0 }}>{error}</p>
          <button onClick={fetchBookings} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            Retry
          </button>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Calendar Grid */}
        <div className="glass" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {days.map((day, i) => {
              const evs = dayBookings(day);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              return (
                <div
                  key={i}
                  data-testid={`day-cell-${format(day, "yyyy-MM-dd")}`}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    minHeight: 80,
                    padding: "8px 10px",
                    borderRight: (i + 1) % 7 !== 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    borderBottom: i < days.length - 7 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: isSelected ? "rgba(124,58,237,0.08)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: today ? 600 : 400, color: today ? "white" : inMonth ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", background: today ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "transparent", marginBottom: 4 }}>
                    {format(day, "d")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {evs.slice(0, 2).map((b) => (
                      <div key={b.id} data-testid={`booking-chip-${b.id}`} style={{ padding: "1px 5px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: `${STATUS_COLORS[b.status] ?? "#6ee7b7"}22`, color: STATUS_COLORS[b.status] ?? "#6ee7b7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.attendees[0]?.name ?? b.title}
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
              Loading bookings...
            </div>
          )}
        </div>

        {/* Day detail panel */}
        <div data-testid="day-detail-panel" className="glass" style={{ padding: 20 }}>
          <h3 data-testid="day-detail-heading" style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 16 }}>
            {selectedDay ? format(selectedDay, "EEEE, MMM d") : "Select a day"}
          </h3>

          {!selectedDay && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 32 }}>
              Click a day to see bookings
            </p>
          )}

          {selectedDay && selectedDayBookings.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Calendar size={28} color="rgba(255,255,255,0.12)" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>No bookings</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedDayBookings.map((b) => {
              const startTime = format(new Date(b.startTime), "h:mm a");
              const endTime = format(new Date(b.endTime), "h:mm a");
              const statusColor = STATUS_COLORS[b.status] ?? "#6ee7b7";
              return (
                <div key={b.id} data-testid={`booking-detail-${b.id}`} style={{ padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "white", lineHeight: 1.4, flex: 1 }}>{b.title}</p>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: `${statusColor}22`, color: statusColor, whiteSpace: "nowrap" }}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <Clock size={11} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{startTime} – {endTime}</span>
                  </div>
                  {b.attendees[0] && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={11} color="rgba(255,255,255,0.3)" />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{b.attendees[0].name} · {b.attendees[0].email}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
