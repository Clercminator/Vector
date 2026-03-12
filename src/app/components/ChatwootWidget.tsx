import React, { useEffect } from "react";

const CHATWOOT_BASE_URL = import.meta.env.VITE_CHATWOOT_BASE_URL as string | undefined;
const CHATWOOT_WEBSITE_TOKEN = import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN as string | undefined;

declare global {
  interface Window {
    chatwootSettings?: {
      hideMessageBubble?: boolean;
      position?: "left" | "right";
      locale?: string;
      type?: "standard" | "expanded_bubble";
      darkMode?: "light" | "dark" | "auto";
    };
    chatwootSDK?: { run: (opts: { websiteToken: string; baseUrl: string }) => void };
    $chatwoot?: { toggle: (open?: boolean) => void };
  }
}

export function ChatwootWidget() {
  useEffect(() => {
    if (!CHATWOOT_BASE_URL?.trim() || !CHATWOOT_WEBSITE_TOKEN?.trim()) return;

    if (document.getElementById("chatwoot-sdk")) return;

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: "right",
      locale: "en",
      type: "standard",
      darkMode: "auto",
      launcherTitle: "Chatea con nosotros",
    };

    const script = document.createElement("script");
    script.id = "chatwoot-sdk";
    script.src = `${CHATWOOT_BASE_URL.replace(/\/$/, "")}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    script.onload = () => {
      window.chatwootSDK?.run({
        websiteToken: CHATWOOT_WEBSITE_TOKEN,
        baseUrl: CHATWOOT_BASE_URL.replace(/\/$/, ""),
      });
    };
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("chatwoot-sdk");
      if (el) el.remove();
    };
  }, []);

  return null;
}

export function openChatwoot() {
  if (typeof window !== "undefined" && window.$chatwoot?.toggle) {
    window.$chatwoot.toggle(true);
  }
}
