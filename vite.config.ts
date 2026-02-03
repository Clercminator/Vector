import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import { VitePWA } from 'vite-plugin-pwa'

const frameworkIds = ['first-principles', 'pareto', 'rpm', 'eisenhower', 'okr'];
const dynamicRoutes = frameworkIds.map(id => `/frameworks/${id}`);

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    define: {
      'process.env.LANGCHAIN_TRACING_V2': JSON.stringify(env.LANGCHAIN_TRACING_V2),
      'process.env.LANGCHAIN_API_KEY': JSON.stringify(env.LANGCHAIN_API_KEY), // Careful: Exposes key to client
      'process.env.LANGCHAIN_ENDPOINT': JSON.stringify(env.LANGCHAIN_ENDPOINT),
      'process.env.LANGCHAIN_PROJECT': JSON.stringify(env.LANGCHAIN_PROJECT),
    },
    plugins: [
    react(),
    tailwindcss(),
    Sitemap({
       hostname: 'https://vector.app', // Placeholder hostname
       dynamicRoutes,
       readable: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vector',
        short_name: 'Vector',
        description: 'Architect Your Ambition',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'node:async_hooks': path.resolve(__dirname, './src/lib/polyfill-async-hooks.ts'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@langchain') || id.includes('langgraph') || id.includes('openai')) {
              return 'ai-vendor';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react') || id.includes('sonner') || id.includes('canvas-confetti')) {
              return 'ui-vendor';
            }
          }
        },
      },
    },
  },
  }
})
