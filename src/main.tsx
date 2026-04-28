import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { inject } from "@vercel/analytics";
import "./styles/index.css";
import App from "@/app/App";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/app/components/language-provider";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import { registerSW } from "virtual:pwa-register";

function queueNonCriticalClientTask(task: () => void) {
  if (typeof window === "undefined") return;

  const requestIdle = window.requestIdleCallback;
  if (typeof requestIdle === "function") {
    requestIdle(() => task(), { timeout: 2000 });
    return;
  }

  window.setTimeout(task, 1200);
}

if (import.meta.env.PROD) {
  queueNonCriticalClientTask(() => {
    injectSpeedInsights();
    inject();
  });

  registerSW({
    immediate: true,
    onNeedRefresh() {
      window.location.reload();
    },
  });
}

if (import.meta.env.PROD && !import.meta.env.VITE_OPENROUTER_PROXY_URL) {
  console.warn(
    "AI features are disabled in production until VITE_OPENROUTER_PROXY_URL is configured.",
  );
}

createRoot(document.getElementById("root")!).render(
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
