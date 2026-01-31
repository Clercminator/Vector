import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { Analytics } from '@vercel/analytics/react'
import './styles/index.css' // CSS usually stays relative or uses a specific alias, leaving relative is fine if it works, usually @/styles/...
import App from '@/app/App'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/app/components/language-provider'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import { HelmetProvider } from 'react-helmet-async'

injectSpeedInsights()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <ErrorBoundary>
              <App />
              <Analytics />
            </ErrorBoundary>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);