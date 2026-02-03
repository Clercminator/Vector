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

// Polyfill process.env for LangChain/LangSmith in browser
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  
  // Map VITE_ vars to standard names expected by LangChainJS
  window.process.env.LANGCHAIN_TRACING_V2 = import.meta.env.VITE_LANGCHAIN_TRACING_V2;
  window.process.env.LANGCHAIN_API_KEY = import.meta.env.VITE_LANGCHAIN_API_KEY;
  window.process.env.LANGCHAIN_PROJECT = import.meta.env.VITE_LANGCHAIN_PROJECT;
  window.process.env.LANGCHAIN_ENDPOINT = import.meta.env.VITE_LANGCHAIN_ENDPOINT;
  
  window.process.env.LANGSMITH_TRACING = import.meta.env.VITE_LANGSMITH_TRACING;
  window.process.env.LANGSMITH_API_KEY = import.meta.env.VITE_LANGSMITH_API_KEY;
  window.process.env.LANGSMITH_PROJECT = import.meta.env.VITE_LANGSMITH_PROJECT;
  window.process.env.LANGSMITH_ENDPOINT = import.meta.env.VITE_LANGSMITH_ENDPOINT;
}

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