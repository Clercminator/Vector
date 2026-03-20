import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import { VitePWA } from 'vite-plugin-pwa'

const frameworkIds = ['first-principles', 'pareto', 'rpm', 'eisenhower', 'okr', 'dsss', 'mandalas', 'gps', 'misogi', 'ikigai'];
const dynamicRoutes = frameworkIds.map(id => `/frameworks/${id}`);

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [
    react(),
    tailwindcss(),
    Sitemap({
       hostname: 'https://vectorplan.xyz',
       dynamicRoutes,
       readable: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/Logos/favicon.ico', 'images/Logos/apple-touch-icon.png', 'images/Logos/pwa-192x192.png', 'images/Logos/pwa-512x512.png'],
      manifest: false,
      useCredentials: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'node:async_hooks': path.resolve(__dirname, './src/lib/polyfill-async-hooks.ts'),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@langchain') || id.includes('langgraph') || id.includes('openai')) {
              return 'ai-vendor';
            }
            if (id.includes('react/') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react') || id.includes('sonner') || id.includes('canvas-confetti') || id.includes('framer-motion')) {
              return 'ui-vendor';
            }
          }
        },
      },
    },
  },
  }
})
