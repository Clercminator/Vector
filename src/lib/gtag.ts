/**
 * Google Analytics 4 (gtag) helpers.
 * Fires custom events for all visitors (anonymous + authenticated).
 * The gtag script and config are loaded in index.html.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function safeGtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

/** Send a custom event to GA4. */
export function gtagEvent(
  eventName: string,
  params: Record<string, string | number | boolean | undefined> = {}
) {
  safeGtag("event", eventName, params);
}

/** Send a page_view for SPA route changes (GA4 doesn't auto-track client-side nav). */
export function gtagPageView(path: string, title?: string) {
  safeGtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
}
