import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import { VitePWA } from 'vite-plugin-pwa'

const frameworkIds = ['first-principles', 'pareto', 'rpm', 'eisenhower', 'okr'];
const dynamicRoutes = frameworkIds.map(id => `/frameworks/${id}`);

export default defineConfig({
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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
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
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion-vendor': ['motion', 'framer-motion'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['lucide-react', 'sonner', 'canvas-confetti'],
        },
      },
    },
  },
})
