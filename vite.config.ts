import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'

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
