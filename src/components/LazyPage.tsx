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
    <div className={`flex flex-col items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[50vh]"}`} aria-live="polite">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
}
