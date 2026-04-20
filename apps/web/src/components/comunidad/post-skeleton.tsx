export function PostSkeleton() {
  return (
    <div
      className="animate-pulse rounded-md bg-white p-4"
      style={{ border: "1px solid var(--border)" }}
      aria-hidden="true"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="h-9 w-9 shrink-0 rounded-full"
          style={{ background: "var(--cream-200)" }}
        />
        <div className="flex-1 space-y-3">
          {/* Name + timestamp */}
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-32 rounded" style={{ background: "var(--cream-200)" }} />
            <div className="h-3 w-16 rounded" style={{ background: "var(--cream-100)" }} />
          </div>
          {/* Content lines */}
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded" style={{ background: "var(--cream-100)" }} />
            <div className="h-3.5 w-4/5 rounded" style={{ background: "var(--cream-100)" }} />
            <div className="h-3.5 w-3/5 rounded" style={{ background: "var(--cream-100)" }} />
          </div>
          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <div className="h-3 w-12 rounded" style={{ background: "var(--cream-100)" }} />
            <div className="h-3 w-12 rounded" style={{ background: "var(--cream-100)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
