import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { inject } from '@vercel/analytics'
import './styles/index.css' 
import App from '@/app/App'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/app/components/language-provider'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import { HelmetProvider } from 'react-helmet-async'

injectSpeedInsights()
inject()

if (import.meta.env.PROD && !import.meta.env.VITE_OPENROUTER_PROXY_URL) {
  console.warn("Security Warning: VITE_OPENROUTER_PROXY_URL is not set in production. App may be using client-side API key.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);