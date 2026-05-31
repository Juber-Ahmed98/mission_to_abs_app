// Minimal page-shaped placeholder shown while a lazy route chunk loads, so the
// screen doesn't flash blank. Uses surface tokens; the pulse is disabled under
// prefers-reduced-motion by the global rule in index.css.
export default function RouteSkeleton() {
  return (
    <div
      className="px-5 pb-28 animate-pulse"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      aria-hidden
    >
      <div className="pt-8 pb-3">
        <div className="h-4 w-20 rounded bg-surface-2" />
        <div className="mt-2 h-8 w-40 rounded bg-surface-2" />
      </div>
      <div className="mt-4 h-40 rounded-card bg-surface-2" />
      <div className="mt-4 space-y-2">
        <div className="h-14 rounded-card bg-surface-2" />
        <div className="h-14 rounded-card bg-surface-2" />
      </div>
    </div>
  );
}
