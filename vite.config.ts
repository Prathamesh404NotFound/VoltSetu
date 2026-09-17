import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    // Don't emit source maps in production — saves bandwidth + hides source
    sourcemap: false,

    // Inline assets smaller than 4 KB as base64 (saves HTTP round-trips)
    assetsInlineLimit: 4096,

    // Split CSS per chunk so each route only loads the styles it needs
    cssCodeSplit: true,

    // Warn when any individual chunk exceeds 600 KB (gzip reference)
    chunkSizeWarningLimit: 600,

    // Show gzip-compressed sizes in the build output for easy auditing
    reportCompressedSize: true,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Heavy vendor libraries — each gets its own async chunk ─────────

          // MapLibre GL — map rendering engine — ~280 KB gzip (unavoidable)
          if (id.includes("node_modules/maplibre-gl") || id.includes("node_modules/@mapbox")) {
            return "vendor-maplibre";
          }
          // Firebase SDK — must be FIRST to prevent circular deps with vendor-misc
          // Capture all firebase/* and @firebase/* sub-packages in one chunk
          if (
            id.includes("node_modules/firebase/") ||
            id.includes("node_modules/@firebase/") ||
            id.includes("node_modules/idb/")
          ) {
            return "vendor-firebase";
          }
          // ⚠️ recharts + d3-* are intentionally NOT split here.
          // recharts imports many d3-* sub-packages which Rollup puts in
          // vendor-misc, creating a circular init order that causes a
          // "Cannot access 'X' before initialization" crash at runtime.
          // Keeping them together in vendor-misc avoids this entirely.
          // Framer Motion — animation library — ~40 KB gzip
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-framer";
          }
          // React Query — data fetching cache
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-query";
          }
          // Lucide icons — large icon set
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-lucide";
          }
          // Radix UI primitives — UI component library
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
          // React Router DOM — routing library
          if (
            id.includes("node_modules/react-router-dom") ||
            id.includes("node_modules/react-router/")
          ) {
            return "vendor-router";
          }
          // ⚠️ react-dom is intentionally NOT split separately.
          // Splitting react-dom from vendor-misc can produce a circular init
          // order with packages that depend on react-dom internals.
          // Rollup handles react + react-dom fine in vendor-misc.
          // Everything else from node_modules goes into a shared misc chunk
          if (id.includes("node_modules")) {
            return "vendor-misc";
          }
        },
      },
    },

  },
}));
