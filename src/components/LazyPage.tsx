import React, { Suspense } from "react";

/**
 * LazyPage wraps a React.lazy-loaded page in a Suspense boundary with a
 * polished brand-matched loading fallback. Each call site receives its own
 * import function so Vite emits one chunk per page (route-level code splitting).
 *
 * Usage: <Route path="/spots" element={<LazyPage load={lazyFindSpots} />} />
 */
const RELOAD_ONCE_KEY = "voltsetu-stale-reload";

/**
 * Reloads the page exactly once when a stale chunk fails to load. Vite hashes
 * chunk filenames on every build, so after a fresh deploy the browser may
 * request an old chunk that no longer exists (Import error / ReferenceError
 * inside the chunk) and render a blank page. A single automatic reload fetches
 * the new index.html and its new hashed imports.
 */
function recoverFromStaleChunk() {
  if (window.sessionStorage.getItem(RELOAD_ONCE_KEY)) return;
  window.sessionStorage.setItem(RELOAD_ONCE_KEY, "1");
  window.location.reload();
}

const lazyCache = new Map<() => Promise<any>, React.LazyExoticComponent<React.ComponentType<any>>>();

function getOrCreateLazyComponent(load: () => Promise<{ default: React.ComponentType<any> }>) {
  let cached = lazyCache.get(load);
  if (!cached) {
    cached = React.lazy(() =>
      load().catch((err) => {
        // Chunk load failure (stale bundle / network glitch): auto-heal once.
        console.error("Lazy chunk failed to load", err);
        recoverFromStaleChunk();
        throw err;
      })
    );
    lazyCache.set(load, cached);
  }
  return cached;
}

export function LazyPage({ load, fullScreen = false }: { load: () => Promise<{ default: React.ComponentType<any> }>; fullScreen?: boolean }) {
  const LazyComponent = getOrCreateLazyComponent(load);

  const fallback = (
    <div
      className={`${fullScreen ? "min-h-screen" : "min-h-[50vh]"} flex flex-col`}
      aria-live="polite"
      aria-label="Loading page…"
    >
      {/* Top bar shimmer */}
      <div className="w-full px-4 pt-8 pb-6 space-y-4 max-w-6xl mx-auto">
        <div className="h-8 w-48 rounded-xl bg-slate-100 overflow-hidden">
          <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:200%_100%]" />
        </div>
        <div className="h-4 w-72 rounded-lg bg-slate-100 overflow-hidden">
          <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:200%_100%]" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden h-64">
              <div className="h-32 bg-slate-100 overflow-hidden">
                <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:200%_100%]" />
              </div>
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-100 overflow-hidden">
                  <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:200%_100%]" />
                </div>
                <div className="h-3 w-1/2 rounded bg-slate-100 overflow-hidden">
                  <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:200%_100%]" />
                </div>
                <div className="h-8 w-full rounded-xl bg-slate-100 overflow-hidden mt-3">
                  <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:200%_100%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );


  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
}
