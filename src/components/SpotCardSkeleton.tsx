/**
 * SpotCardSkeleton — shimmer placeholder matching SpotCard dimensions.
 *
 * Shown during the initial data fetch so the layout doesn't jump and the
 * user sees progress immediately instead of a bare spinner.
 */
export default function SpotCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm"
      aria-hidden="true"
    >
      {/* Image placeholder */}
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>

      <div className="p-4 space-y-3">
        {/* Badge row */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full skeleton-shimmer" />
          </div>
          <div className="h-5 w-12 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full skeleton-shimmer" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-5 w-3/4 rounded-lg bg-slate-100 overflow-hidden">
            <div className="h-full skeleton-shimmer" />
          </div>
          <div className="h-4 w-1/2 rounded-lg bg-slate-100 overflow-hidden">
            <div className="h-full skeleton-shimmer" />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-1">
          <div className="h-4 w-16 rounded bg-slate-100 overflow-hidden">
            <div className="h-full skeleton-shimmer" />
          </div>
          <div className="h-4 w-14 rounded bg-slate-100 overflow-hidden">
            <div className="h-full skeleton-shimmer" />
          </div>
          <div className="h-4 w-12 rounded bg-slate-100 overflow-hidden">
            <div className="h-full skeleton-shimmer" />
          </div>
        </div>

        {/* Amenity chips */}
        <div className="flex items-center gap-1.5 pt-1">
          {[60, 48, 72].map((w, i) => (
            <div
              key={i}
              className="h-6 rounded-full bg-slate-100 overflow-hidden"
              style={{ width: `${w}px` }}
            >
              <div className="h-full skeleton-shimmer" />
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div className="h-10 w-full rounded-xl bg-slate-100 overflow-hidden mt-2">
          <div className="h-full skeleton-shimmer" />
        </div>
      </div>

      <style>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.7) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
