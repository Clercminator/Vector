import { defineConfig } from "vitest/config";
import type { PluginOption } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import Sitemap from "vite-plugin-sitemap";
import { VitePWA } from "vite-plugin-pwa";
import { buildPublicRoutes } from "./scripts/publicRoutes.mjs";

const dynamicRoutes = buildPublicRoutes();

export default defineConfig(({ mode }) => {
  const enableBundleVisualizer = mode === "analyze";
  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
    Sitemap({
      hostname: "https://vectorplan.xyz",
      dynamicRoutes,
      readable: true,
    }),
    VitePWA({
      injectRegister: null,
      registerType: "autoUpdate",
      includeAssets: [
        "images/Logos/favicon.ico",
        "images/Logos/apple-touch-icon.png",
        "images/Logos/pwa-192x192.png",
        "images/Logos/pwa-512x512.png",
      ],
      manifest: false,
      useCredentials: false,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ];

  if (enableBundleVisualizer) {
    plugins.push(
      visualizer({
        filename: "dist/bundle-analysis.html",
        gzipSize: true,
        brotliSize: true,
        open: false,
        template: "treemap",
      }),
    );
  }

  return {
    base: "/",
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "node:async_hooks": path.resolve(
          __dirname,
          "./src/lib/polyfill-async-hooks.ts",
        ),
      },
    },
    test: {
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["tests/e2e/**", "test-results/**", "dist/**"],
    },
    build: {
      modulePreload: false,
      sourcemap: false,
      chunkSizeWarningLimit: 800,
    },
  };
});
