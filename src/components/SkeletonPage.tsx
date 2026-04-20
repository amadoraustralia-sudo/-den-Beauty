export function SkeletonLine({ w = "100%", h = "1rem" }: { w?: string; h?: string }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: 6 }}
    />
  );
}

export function SkeletonCard({ rows = 3, height }: { rows?: number; height?: string }) {
  return (
    <div className="card p-5" style={height ? { height } : undefined}>
      <SkeletonLine w="40%" h="0.875rem" />
      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonLine key={i} w={i % 2 === 0 ? "100%" : "75%"} />
        ))}
      </div>
    </div>
  );
}

export default function PageSkeleton({
  cards = 4,
  hasTopbar = true,
}: {
  cards?: number;
  hasTopbar?: boolean;
}) {
  return (
    <div>
      {hasTopbar && (
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <SkeletonLine w="160px" h="1.125rem" />
            <SkeletonLine w="110px" h="0.75rem" />
          </div>
          <SkeletonLine w="120px" h="2rem" />
        </div>
      )}
      <div className="p-3 lg:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {Array.from({ length: Math.min(cards, 4) }).map((_, i) => (
            <div key={i} className="stat-card">
              <SkeletonLine w="60%" h="0.75rem" />
              <div style={{ marginTop: "0.875rem" }}>
                <SkeletonLine w="80%" h="1.5rem" />
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <SkeletonLine w="50%" h="0.75rem" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard rows={5} height="220px" />
          <SkeletonCard rows={5} height="220px" />
        </div>
      </div>
    </div>
  );
}
