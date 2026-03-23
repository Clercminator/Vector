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
      launcherTitle?: string;
    };
    chatwootSDK?: { run: (opts: { websiteToken: string; baseUrl: string }) => void };
    $chatwoot?: { toggle: (open?: boolean) => void };
  }
}

let chatwootInjectPromise: Promise<void> | null = null;

function injectChatwootScript(): Promise<void> {
  if (chatwootInjectPromise) return chatwootInjectPromise;
  if (!CHATWOOT_BASE_URL?.trim() || !CHATWOOT_WEBSITE_TOKEN?.trim()) {
    chatwootInjectPromise = Promise.resolve();
    return chatwootInjectPromise;
  }
  if (typeof document === "undefined") {
    chatwootInjectPromise = Promise.resolve();
    return chatwootInjectPromise;
  }
  if (document.getElementById("chatwoot-sdk")) {
    chatwootInjectPromise = Promise.resolve();
    return chatwootInjectPromise;
  }

  chatwootInjectPromise = new Promise((resolve, reject) => {
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
      try {
        window.chatwootSDK?.run({
          websiteToken: CHATWOOT_WEBSITE_TOKEN,
          baseUrl: CHATWOOT_BASE_URL.replace(/\/$/, ""),
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error("Chatwoot SDK failed to load"));
    document.body.appendChild(script);
  });

  return chatwootInjectPromise;
}

/** Load Chatwoot as soon as possible (e.g. user opened chat before deferred load). */
export function ensureChatwootLoaded(): Promise<void> {
  return injectChatwootScript();
}

function waitForChatwootReady(maxMs = 8000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (typeof window !== "undefined" && window.$chatwoot?.toggle) {
        resolve();
        return;
      }
      if (Date.now() - start > maxMs) {
        reject(new Error("Chatwoot not ready"));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function ChatwootWidget() {
  useEffect(() => {
    if (!CHATWOOT_BASE_URL?.trim() || !CHATWOOT_WEBSITE_TOKEN?.trim()) return;
    if (document.getElementById("chatwoot-sdk")) return;

    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scroll", onScroll, scrollOpts);
      window.removeEventListener("click", onPointer, true);
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("touchstart", onTouch, touchOpts);
      void injectChatwootScript();
    };

    const scrollOpts: AddEventListenerOptions = { passive: true };
    const touchOpts: AddEventListenerOptions = { passive: true };

    const onScroll = () => load();
    const onPointer = () => load();
    const onTouch = () => load();

    window.addEventListener("scroll", onScroll, scrollOpts);
    window.addEventListener("click", onPointer, true);
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("touchstart", onTouch, touchOpts);

    return () => {
      window.removeEventListener("scroll", onScroll, scrollOpts);
      window.removeEventListener("click", onPointer, true);
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("touchstart", onTouch, touchOpts);
    };
  }, []);

  return null;
}

export async function openChatwoot() {
  try {
    await ensureChatwootLoaded();
  } catch {
    return;
  }
  try {
    await waitForChatwootReady();
  } catch {
    /* Widget may still appear; toggle may be unavailable */
  }
  if (typeof window !== "undefined" && window.$chatwoot?.toggle) {
    window.$chatwoot.toggle(true);
  }
}
