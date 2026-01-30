import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import App from './app/App.tsx'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from './app/components/language-provider.tsx'
import { ErrorBoundary } from './app/components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);