import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

async function loadReplitPlugins() {
  const plugins = [];
  
  // Only load Replit plugins in development and when in Replit environment
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
      plugins.push(runtimeErrorOverlay.default());
    } catch (e) {
      console.warn("Failed to load @replit/vite-plugin-runtime-error-modal:", e.message);
    }

    try {
      const cartographer = await import("@replit/vite-plugin-cartographer");
      plugins.push(cartographer.cartographer());
    } catch (e) {
      console.warn("Failed to load @replit/vite-plugin-cartographer:", e.message);
    }
  }
  
  return plugins;
}

export default defineConfig(async () => ({
  plugins: [
    react(),
    ...(await loadReplitPlugins()),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
