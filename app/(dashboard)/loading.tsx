export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 260, height: 32, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 180, height: 16, borderRadius: 8 }} />
      </div>
      {/* Cards skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 18 }} />
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="skeleton" style={{ height: 280, borderRadius: 18 }} />
        <div className="skeleton" style={{ height: 280, borderRadius: 18 }} />
      </div>
    </div>
  );
}
