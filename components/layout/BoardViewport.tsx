"use client";

import React, { useRef, useState, useEffect } from "react";

interface BoardViewportProps {
  /** Total number of columns in the board */
  columnCount: number;
  /** Minimum column width before horizontal scroll kicks in (default 280) */
  minColWidth?: number;
  /** Maximum column width when filling available space (default 360) */
  maxColWidth?: number;
  children: React.ReactNode;
}

/**
 * BoardViewport — adaptive kanban/board container.
 *
 * Behavior:
 * - Measures available width via ResizeObserver
 * - If all columns fit at minColWidth → CSS Grid fills the space evenly (no scroll)
 * - If columns overflow → Flex row with horizontal scroll + subtle right fade mask
 *
 * This means columns always fill the available space rather than leaving dead air,
 * and horizontal scroll only appears when it's actually needed.
 */
export default function BoardViewport({
  columnCount,
  minColWidth = 280,
  maxColWidth = 360,
  children,
}: BoardViewportProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [needsScroll, setNeedsScroll] = useState(true); // default true — avoids grid overflow on first paint

  useEffect(() => {
    if (!wrapperRef.current) return;
    const GAP = 14;
    const measure = () => {
      const w = wrapperRef.current!.clientWidth;
      setAvailableWidth(w);
      const totalMinWidth = columnCount * minColWidth + (columnCount - 1) * GAP;
      setNeedsScroll(totalMinWidth > w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [columnCount, minColWidth]);

  const GAP = 14;

  // Grid mode: columns fill available space evenly
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columnCount}, minmax(${minColWidth}px, ${maxColWidth}px))`,
    gap: GAP,
    alignItems: "start",
    paddingBottom: 20,
    paddingTop: 2,
  };

  // Flex scroll mode: fixed-min columns, horizontal scroll
  const flexStyle: React.CSSProperties = {
    display: "flex",
    gap: GAP,
    overflowX: "auto",
    paddingBottom: 24,
    paddingTop: 2,
    paddingRight: 48,
    alignItems: "flex-start",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(124,58,237,0.35) transparent",
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%", overflow: "clip" }}>
      <div style={needsScroll ? flexStyle : gridStyle}>
        {/* Inject lane sizing via CSS custom props */}
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          return React.cloneElement(child as React.ReactElement<any>, {
            style: {
              ...(child as React.ReactElement<any>).props.style,
              ...(needsScroll
                ? { flex: `0 0 ${minColWidth}px`, width: minColWidth, minWidth: minColWidth, maxWidth: maxColWidth }
                : { minWidth: 0, flex: 1 }
              ),
            },
          });
        })}
      </div>

      {/* Right fade mask — only shown when scrolling */}
      {needsScroll && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 24,
            width: 60,
            background: "linear-gradient(to right, transparent, #07070f)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}
