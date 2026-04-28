declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string;
  }
}

const MERCADOPAGO_SECURITY_SCRIPT_ID = "mercadopago-security-sdk";
const MERCADOPAGO_SECURITY_SCRIPT_URL =
  "https://www.mercadopago.com/v2/security.js";

export function getMercadoPagoDeviceId(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const deviceId = window.MP_DEVICE_SESSION_ID;
  return typeof deviceId === "string" && deviceId.trim()
    ? deviceId.trim()
    : undefined;
}

let securityLoadPromise: Promise<string | undefined> | null = null;

export async function ensureMercadoPagoSecurityLoaded(
  view = "checkout",
): Promise<string | undefined> {
  if (typeof document === "undefined") {
    return undefined;
  }

  if (!securityLoadPromise) {
    securityLoadPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(
        MERCADOPAGO_SECURITY_SCRIPT_ID,
      ) as HTMLScriptElement | null;

      const handleLoad = () => resolve(getMercadoPagoDeviceId());

      if (existing) {
        if (existing.dataset.loaded === "true") {
          handleLoad();
          return;
        }

        existing.addEventListener("load", handleLoad, { once: true });
        existing.addEventListener(
          "error",
          () => {
            securityLoadPromise = null;
            reject(new Error("Failed to load MercadoPago security script"));
          },
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.id = MERCADOPAGO_SECURITY_SCRIPT_ID;
      script.src = MERCADOPAGO_SECURITY_SCRIPT_URL;
      script.async = true;
      script.setAttribute("view", view);
      script.addEventListener(
        "load",
        () => {
          script.dataset.loaded = "true";
          handleLoad();
        },
        { once: true },
      );
      script.addEventListener(
        "error",
        () => {
          securityLoadPromise = null;
          reject(new Error("Failed to load MercadoPago security script"));
        },
        { once: true },
      );
      document.head.appendChild(script);
    });
  }

  return securityLoadPromise;
}