import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Platform-owned Vite config for the `vite-react` sandbox image.
// - port 3000 / host 0.0.0.0: the platform's health checks, preview proxy and
//   warm-pool plumbing all assume the dev server answers on :3000.
// - allowedHosts true: sandboxes are reached through provider hostnames
//   (*.e2b.app, *.dev.dual7.app, *.modal.host, ...) — Vite 5.4+ blocks
//   unknown hosts by default.
// - usePolling: HMR must survive snapshot restore (same reason Next sets
//   watchOptions.pollIntervalMs).
// - /api proxy: client-kind apps talk to the synced API service copy on :3002.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    watch: { usePolling: true, interval: 1000 },
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET || "http://127.0.0.1:3002",
        changeOrigin: false,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
});
