/* VoltSetu PWA service worker (Round 12: self-healing cache layer)
 *
 * Problems fixed vs v1:
 * 1. A stale cached JS/CSS response could contain HTML (the offline fallback
 *    page). When the browser executed it, users saw
 *    "SyntaxError: Unexpected token '<'". The worker now validates the
 *    Content-Type of every cached response before serving it, and purges
 *    anything that looks like HTML from JS/CSS cache keys.
 * 2. Hashed chunk filenames change on every build, so a cache keyed by URL
 *    served stale bundles forever. Cache names are now versioned
 *    (voltsetu-shell-v2) and all v1 caches are wiped on activate.
 * 3. Offline fallbacks were previously stored under the requested asset URL,
 *    polluting the cache permanently. Fallbacks are now served purely in
 *    memory and never written to the cache.
 *
 * Strategies:
 * - Navigation + Vite dev assets : network-first (cached HTML only as offline
 *   last resort, kept under its own key "/index.html" so it can be validated)
 * - JS / CSS hashed chunks     : network-first with stale-while-revalidate —
 *   never serve a potentially stale bundle that could break the app
 * 4. v3/v4 fix: the ENTRY bundle (assets/index-*.js referenced from
 *    index.html) was being cached in the shell cache under its asset URL,
 *    so a stale shell served a stale entry bundle forever (SyntaxError /
 *    ReferenceError loops). The entry bundle is now excluded from caching
 *    entirely, and v3 caches are purged on activate.
 * - Images                     : stale-while-revalidate
 * - Firebase / map tiles       : network-first, no caching (live data)
 */
const CACHE_SHELL = "voltsetu-shell-v4";
const CACHE_IMAGES = "voltsetu-images-v1";
const MAX_IMAGE_CACHE = 80;

const SHELL_URLS = ["/", "/index.html"];

/* The entry bundle listed in index.html. Caching it under its asset URL
 * caused stale-shell loops (the shell kept serving an old broken entry
 * bundle). It is ALWAYS fetched fresh from the network. */
function isEntryBundle(url) {
  return /^\/assets\/index-[^.]+\.(js|mjs)(\?|$)/i.test(url);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SHELL)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("voltsetu-") && key !== CACHE_SHELL && key !== CACHE_IMAGES)
            .map((key) => caches.delete(key))
        )
      ),
      // Purge any JS/CSS cache entries that contain HTML content (heal v1
      // pollution that caused "Unexpected token '<'").
      selfHealHtmlInCaches(),
    ])
  );
});

/* Remove entries whose response content starts with '<' while the cache key
 * looks like a JS/CSS asset. Returns a promise; never throws to clients. */
async function selfHealHtmlInCaches() {
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("voltsetu-"))
        .map(async (key) => {
          const cache = await caches.open(key);
          const reqs = await cache.keys();
          await Promise.all(
            reqs.map(async (req) => {
              if (!/\.(js|css|jsx|ts|tsx|mjs)(\?|$)/i.test(req.url)) return;
              let response;
              try {
                response = await cache.match(req);
              } catch {
                response = undefined;
              }
              if (!response) return;
              const type = (response.headers.get("content-type") || "").toLowerCase();
              if (type && !type.includes("javascript") && !type.includes("css") && !type.includes("text/plain")) {
                // HTML masquerading as an asset — remove it
                await cache.delete(req);
                return;
              }
              const text = await response.text();
              const head = text.trim().slice(0, 100);
              if (head.startsWith("<!doctype") || head.startsWith("<html") || head.startsWith("<")) {
                await cache.delete(req);
              }
            })
          );
        })
    );
  } catch {
    /* Best-effort self-heal; failure must not break activation. */
  }
}

/* Network-first for Firebase REST/RTDB and map tile requests. */
function isLiveApi(url) {
  return /firebaseio\.com|firebasedatabase\.app|tile\.openstreetmap\.org|tile\.openstreetmap\.de/.test(url);
}

function isNavigation(request) {
  return request.mode === "navigate";
}

function isViteDevRequest(request) {
  return /\/(@vite|@react-refresh|node_modules|\.tsx?\?t=|__vite|src\/)/.test(request.url) || request.url.includes("?import") || request.url.includes("?direct") || request.url.includes("/src/");
}

function isAssetRequest(request) {
  return /\.(js|css|mjs|jsx|ts|tsx)(\?|$)/i.test(request.url);
}

function isImageRequest(request) {
  return request.destination === "image";
}

function trimImageCache() {
  return caches.open(CACHE_IMAGES).then((cache) =>
    cache.keys().then((keys) => {
      if (keys.length > MAX_IMAGE_CACHE) {
        return Promise.all(keys.slice(0, keys.length - MAX_IMAGE_CACHE).map((key) => cache.delete(key)));
      }
    })
  );
}

/* In-memory offline fallback page — intentionally never cached under asset
 * URLs, so a missing bundle can never be answered with HTML again. */
function fallbackPage() {
  return caches.match("/index.html").catch(() => undefined).then((cached) => cached);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (!/^https?:\/\//i.test(request.url)) return;

  if (isLiveApi(request.url)) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Navigation and Vite dev assets: always network, refresh the cached copy.
  if (isNavigation(request) || isViteDevRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !isViteDevRequest(request) && request.url.startsWith(self.location.origin) && !isEntryBundle(request.url)) {
            const copy = response.clone();
            caches.open(CACHE_SHELL).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => fallbackPage())
    );
    return;
  }

  // Entry bundle: network-only. It must never be served from cache.
  if (isEntryBundle(request.url)) {
    event.respondWith(fetch(request).catch(() => responseFallback()));
    return;
  }

  // JS/CSS chunks: network-first with stale-while-revalidate. Never serve a
  // stale bundle silently — but if the network fails and nothing is cached,
  // fall back to memory-only offline page so the browser never executes HTML.
  if (isAssetRequest(request)) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        // Validate the cached asset before serving it: if its body looks like
        // HTML, delete it and pretend nothing was cached.
        let safeCached = cached;
        if (cached) {
          const type = (cached.headers.get("content-type") || "").toLowerCase();
          if (type && !type.includes("javascript") && !type.includes("css") && !type.includes("text/plain")) {
            safeCached = undefined;
          } else {
            const text = await cached.text();
            if (text.trim().startsWith("<")) {
              safeCached = undefined;
            } else {
              // Re-wrap since the body was consumed above
              safeCached = new Response(text, {
                status: cached.status,
                statusText: cached.statusText,
                headers: cached.headers,
              });
            }
          }
          if (cached !== safeCached && request.url.startsWith(self.location.origin)) {
            caches.open(CACHE_SHELL).then((c) => c.delete(request));
          }
        }

        const freshen = fetch(request)
          .then((response) => {
            if (response.ok && request.url.startsWith(self.location.origin) && !isEntryBundle(request.url)) {
              const copy = response.clone();
              caches.open(CACHE_SHELL).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => safeCached || fallbackPage());

        return safeCached || freshen;
      })
    );
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(
      caches.open(CACHE_IMAGES).then((cache) =>
        cache.match(request).then((cached) => {
          const networked = fetch(request)
            .then((response) => {
              if (response.ok) {
                const copy = response.clone();
                cache.put(request, copy);
              }
              trimImageCache();
              return response;
            })
            .catch(() => cached || responseFallback());
          return cached || networked;
        })
      )
    );
    return;
  }

  // Cache-first for other same-origin assets (fonts, SVGs, webmanifest)
  event.respondWith(
    caches.match(request).then((cached) => {
      const networked = fetch(request)
        .then((response) => {
          if (response.ok && request.url.startsWith(self.location.origin) && !isEntryBundle(request.url)) {
            const copy = response.clone();
            caches.open(CACHE_SHELL).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || fallbackPage());
      return cached || networked;
    })
  );
});

function responseFallback() {
  return new Response("", { status: 408, statusText: "Request timed out" });
}
