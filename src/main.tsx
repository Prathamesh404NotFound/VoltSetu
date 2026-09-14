import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./lib/firebase";

/* ---------- PWA hardening ---------- */
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("ChargePush SW registered:", registration.scope);
        // When a new deploy replaces the cached shell, force a full reload so
        // the page picks up the new index.html and its new hashed chunks.
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      })
      .catch((error) => {
        console.warn("ChargePush SW registration failed:", error);
      });
  });
}

/* ---------- Stale-chunk self-heal ----------
 * After every Vercel deploy, chunk filenames change (content hashes). A
 * browser holding the old index.html may request a chunk that no longer
 * exists, producing chunk-load errors that render a blank page. Two global
 * handlers recover automatically:
 * 1. Unhandled promise rejections caused by chunk imports reload once.
 * 2. Global script errors that look like chunk-load failures reload once.
 */
const STALE_RELOAD_KEY = "chargepush-stale-reload";
const MAX_RELOADS = 1;

function staleChunkReloadCount(): number {
  return Number(window.sessionStorage.getItem(STALE_RELOAD_KEY) || 0);
}

function maybeReloadForStaleChunk() {
  if (staleChunkReloadCount() >= MAX_RELOADS) return;
  window.sessionStorage.setItem(STALE_RELOAD_KEY, String(staleChunkReloadCount() + 1));
  window.location.reload();
}

window.addEventListener("unhandledrejection", (event) => {
  const msg = String(event.reason?.message || event.reason || "").toLowerCase();
  // Vite chunk-load failures surface as "Failed to fetch" or "import()" errors
  // referencing /assets/*.js. Treat them as stale-bundle signals and reload.
  if (/failed to fetch|failed to load module|error.*chunk|import\(\)|unexpected token/i.test(msg) && /\/assets\//.test(msg)) {
    console.warn("[ChargePush] suspected stale chunk, auto-reloading", msg);
    maybeReloadForStaleChunk();
  }
});

/* Persist the PWA install prompt so the app can offer a native install CTA. */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

let pendingInstallEvent: BeforeInstallPromptEvent | null = null;

window.addEventListener("beforeinstallprompt", (event: Event) => {
  event.preventDefault();
  pendingInstallEvent = event as BeforeInstallPromptEvent;
});

export function getPwaInstallEvent(): BeforeInstallPromptEvent | null {
  return pendingInstallEvent;
}

export function consumePwaInstallEvent(): BeforeInstallPromptEvent | null {
  const event = pendingInstallEvent;
  pendingInstallEvent = null;
  return event;
}
/* -------------------------------- */

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

