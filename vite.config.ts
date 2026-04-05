import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import Sitemap from "vite-plugin-sitemap";
import { VitePWA } from "vite-plugin-pwa";

const staticRoutes = ["/about", "/pricing", "/community", "/guides"];
const frameworkIds = [
  "first-principles",
  "pareto",
  "rpm",
  "eisenhower",
  "okr",
  "dsss",
  "mandalas",
  "gps",
  "misogi",
  "ikigai",
];
const articleSlugs = [
  "how-to-choose-the-right-goal-framework",
  "best-framework-for-career-change",
  "best-framework-for-startup-planning",
  "best-framework-for-studying",
  "best-framework-for-fitness-goals",
  "career-planning-system",
  "personal-okr-system",
  "goal-prioritization-system",
  "study-planning-system",
  "life-planning-framework",
  "okr-generator",
  "ikigai-template",
  "eisenhower-matrix-tool",
  "pareto-analysis-template",
  "career-change-planner",
  "goal-breakdown-tool",
  "example-okr-for-career-change",
  "example-study-plan-using-pareto",
  "best-goal-setting-method",
  "planning-system-for-personal-goals",
  "decision-framework-for-complex-goals",
  "life-planning-tool",
  "personal-strategy-framework",
  "priority-matrix-guide",
  "ikigai-vs-okr",
  "first-principles-vs-pareto",
  "rpm-vs-okr",
  "smart-goals-vs-eisenhower",
  "pareto-vs-eisenhower-matrix",
  "okr-vs-smart-goals",
  "vector-vs-notion-goal-planning",
  "vector-vs-trello-personal-planning",
  "okrs-in-vector-vs-spreadsheet-tracking",
  "how-to-use-pareto-for-studying",
  "how-to-use-okrs-for-personal-goals",
  "how-to-use-ikigai-for-career-clarity",
  "how-to-stop-feeling-overwhelmed",
  "how-to-prioritize-too-many-goals",
  "how-to-turn-a-vague-goal-into-a-plan",
];
const dynamicRoutes = [
  ...staticRoutes,
  ...frameworkIds.map((id) => `/frameworks/${id}`),
  ...articleSlugs.map((slug) => `/articles/${slug}`),
];

export default defineConfig(() => {
  return {
    base: "/",
    plugins: [
      react(),
      tailwindcss(),
      Sitemap({
        hostname: "https://vectorplan.xyz",
        dynamicRoutes,
        readable: true,
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "images/Logos/favicon.ico",
          "images/Logos/apple-touch-icon.png",
          "images/Logos/pwa-192x192.png",
          "images/Logos/pwa-512x512.png",
        ],
        manifest: false,
        useCredentials: false,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "node:async_hooks": path.resolve(
          __dirname,
          "./src/lib/polyfill-async-hooks.ts",
        ),
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("@langchain/langgraph") ||
                id.includes("langgraph")
              ) {
                return "langgraph-vendor";
              }
              if (
                id.includes("@langchain") ||
                id.includes("langchain") ||
                id.includes("openai")
              ) {
                return "ai-vendor";
              }
              if (
                id.includes("react/") ||
                id.includes("react-dom") ||
                id.includes("react-router-dom")
              ) {
                return "react-vendor";
              }
              if (id.includes("@supabase")) {
                return "supabase-vendor";
              }
              if (id.includes("recharts")) {
                return "charts-vendor";
              }
              if (
                id.includes("jspdf") ||
                id.includes("html2canvas") ||
                id.includes("jszip") ||
                id.includes("file-saver")
              ) {
                return "export-vendor";
              }
              if (
                id.includes("react-markdown") ||
                id.includes("remark") ||
                id.includes("rehype")
              ) {
                return "content-vendor";
              }
              if (id.includes("@radix-ui")) {
                return "radix-vendor";
              }
              if (
                id.includes("lucide-react") ||
                id.includes("sonner") ||
                id.includes("canvas-confetti") ||
                id.includes("motion/")
              ) {
                return "ui-vendor";
              }
            }
          },
        },
      },
    },
  };
});
