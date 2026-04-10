/**
 * MercadoPago helpers for both Checkout Pro and tokenized subscriptions.
 */

declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string;
  }
}

const MERCADOPAGO_SECURITY_SCRIPT_ID = "mercadopago-security-sdk";
const MERCADOPAGO_SECURITY_SCRIPT_URL =
  "https://www.mercadopago.com/v2/security.js";
const MERCADOPAGO_ENV_QUERY_PARAM = "mp_env";
const MERCADOPAGO_ENV_STORAGE_KEY = "vector.mercadopago.environment";

type MercadoPagoEnvironmentMode = "live" | "test";

const getBrowserHostname = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname.toLowerCase();
};

function getMercadoPagoEnvironmentOverride(): MercadoPagoEnvironmentMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params
      .get(MERCADOPAGO_ENV_QUERY_PARAM)
      ?.trim()
      .toLowerCase();

    if (queryValue === "test" || queryValue === "live") {
      window.localStorage.setItem(MERCADOPAGO_ENV_STORAGE_KEY, queryValue);
      return queryValue;
    }

    const storedValue = window.localStorage
      .getItem(MERCADOPAGO_ENV_STORAGE_KEY)
      ?.trim()
      .toLowerCase();

    if (storedValue === "test" || storedValue === "live") {
      return storedValue;
    }
  } catch {
    // Ignore storage and URL parsing issues.
  }

  return null;
}

export function shouldUseMercadoPagoTestEnvironment(): boolean {
  const forcedEnvironment =
    (import.meta.env.VITE_MERCADOPAGO_ENVIRONMENT as string | undefined) ?? "";
  const normalizedForcedEnvironment = forcedEnvironment.trim().toLowerCase();

  if (normalizedForcedEnvironment === "test") {
    return true;
  }
  if (normalizedForcedEnvironment === "live") {
    return false;
  }

  const environmentOverride = getMercadoPagoEnvironmentOverride();
  if (environmentOverride === "test") {
    return true;
  }
  if (environmentOverride === "live") {
    return false;
  }

  const hostname = getBrowserHostname();
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

const getSupabaseUrl = (): string => {
  const url =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
    (import.meta.env.VITE_supabase_url as string | undefined) ??
    "";
  return url.replace(/\/$/, "");
};

export function isMercadoPagoConfigured(): boolean {
  const url = getSupabaseUrl();
  return Boolean(url.trim());
}

export function getMercadoPagoPublicKey(): string {
  const testKey = (
    (import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY_PRUEBA as
      | string
      | undefined) ?? ""
  ).trim();
  const liveKey = (
    (import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string | undefined) ??
    (import.meta.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY as
      | string
      | undefined) ??
    ""
  ).trim();

  if (shouldUseMercadoPagoTestEnvironment() && testKey) {
    return testKey;
  }

  return liveKey || testKey;
}

export function isMercadoPagoSubscriptionConfigured(): boolean {
  return isMercadoPagoConfigured() && Boolean(getMercadoPagoPublicKey());
}

export type PaymentPurchaseType = "tier" | "extra_credits";
export type PaymentProvider = "mercadopago" | "lemonsqueezy";

export interface PaymentReturnUrlOptions {
  purchaseType?: PaymentPurchaseType;
  provider?: PaymentProvider;
  tier?: string;
  origin?: string;
  successPath?: string;
  failurePath?: string;
  pendingPath?: string;
}

export function buildPaymentReturnUrls(options: PaymentReturnUrlOptions = {}) {
  const purchaseType = options.purchaseType ?? "tier";
  const origin =
    options.origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const provider = options.provider;
  const tier = options.tier?.trim();
  const successPath =
    options.successPath ??
    (purchaseType === "extra_credits" ? "/profile" : "/dashboard");
  const failurePath =
    options.failurePath ??
    (purchaseType === "extra_credits" ? "/profile" : "/pricing");
  const pendingPath = options.pendingPath ?? successPath;

  const buildUrl = (
    path: string,
    status: "success" | "failure" | "pending",
  ) => {
    const url = new URL(path, origin || "http://localhost");
    url.searchParams.set("payment", status);
    url.searchParams.set("purchase", purchaseType);
    if (provider) {
      url.searchParams.set("provider", provider);
    }
    if (tier) {
      url.searchParams.set("tier", tier);
    }
    return origin ? url.toString() : `${url.pathname}${url.search}`;
  };

  return {
    success: buildUrl(successPath, "success"),
    failure: buildUrl(failurePath, "failure"),
    pending: buildUrl(pendingPath, "pending"),
  };
}

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

export interface CreateCheckoutOptions {
  tier?: string;
  title?: string;
  description?: string;
  itemId?: string;
  amount?: number;
  currency?: string;
  userId?: string;
  userEmail?: string;
  billingMode?: "one_time" | "subscription";
  billingInterval?: "month" | "year";
  purchaseType?: "tier" | "extra_credits";
  creditsAmount?: number;
  creditPackId?: "credits_5" | "credits_20";
  deviceId?: string;
  backUrlSuccess?: string;
  backUrlFailure?: string;
  backUrlPending?: string;
}

export interface CreateSubscriptionOptions {
  tier: "builder" | "max";
  title?: string;
  amount?: number;
  currency?: string;
  userId?: string;
  userEmail?: string;
  billingInterval?: "month" | "year";
  cardTokenId: string;
  deviceId?: string;
  backUrlSuccess?: string;
  backUrlFailure?: string;
  backUrlPending?: string;
}

export interface CreateSubscriptionResult {
  subscriptionId?: string;
  status?: string;
  checkoutMode?: string;
}

/**
 * Creates a MercadoPago checkout preference via the Edge Function and redirects the user to MercadoPago.
 * Requires: VITE_SUPABASE_URL (or VITE_supabase_url) set, and mercado-pago-preference Edge Function deployed with MERCADOPAGO_ACCESS_TOKEN in Secrets.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { trackEvent } from "./analytics";

function normalizeMercadoPagoFunctionMessage(message: string): string {
  const normalized = message.trim();

  if (/card token was generated without cvv validation/i.test(normalized)) {
    if (typeof window !== "undefined") {
      const language = window.location.pathname.split("/").filter(Boolean)[0];
      if (language === "es") {
        return "Mercado Pago no pudo validar el codigo de seguridad. Vuelve a escribir el CVV y espera un segundo antes de confirmar. Si estas probando con tarjetas de prueba, recuerda que vectorplan.xyz usa credenciales live y para pruebas necesitas un ambiente test con el email test@testuser.com.";
      }
      if (language === "pt") {
        return "O Mercado Pago nao conseguiu validar o codigo de seguranca. Digite o CVV novamente e espere um segundo antes de confirmar. Se voce estiver usando cartoes de teste, lembre que vectorplan.xyz usa credenciais live e os testes exigem ambiente test com o email test@testuser.com.";
      }
      if (language === "fr") {
        return "Mercado Pago n'a pas pu valider le code de securite. Saisissez a nouveau le CVV et attendez une seconde avant de confirmer. Si vous testez avec des cartes de test, notez que vectorplan.xyz utilise des identifiants live et qu'il faut un environnement de test avec l'email test@testuser.com.";
      }
      if (language === "de") {
        return "Mercado Pago konnte den Sicherheitscode nicht validieren. Gib den CVV erneut ein und warte eine Sekunde vor dem Bestatigen. Wenn du mit Testkarten pruefst, beachte bitte, dass vectorplan.xyz Live-Zugangsdaten nutzt und Tests eine Testumgebung mit der E-Mail test@testuser.com brauchen.";
      }
    }

    return "MercadoPago could not validate the security code. Re-enter the CVV and wait a second before confirming. If you are using test cards, note that vectorplan.xyz runs with live credentials and test purchases require a test environment with the email test@testuser.com.";
  }

  return normalized;
}

async function resolveFunctionErrorMessage(error: unknown): Promise<string> {
  const context =
    error && typeof error === "object" && "context" in error
      ? (error as { context?: unknown }).context
      : undefined;

  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      if (payload && typeof payload === "object") {
        const message =
          (payload as { error?: string; message?: string }).error ??
          (payload as { error?: string; message?: string }).message;
        if (message) {
          return normalizeMercadoPagoFunctionMessage(message);
        }
      }
    } catch {
      try {
        const text = await context.clone().text();
        if (text.trim()) {
          return normalizeMercadoPagoFunctionMessage(text);
        }
      } catch {
        // Fall through to the default message.
      }
    }
  }

  if (error instanceof Error && error.message) {
    return normalizeMercadoPagoFunctionMessage(error.message);
  }

  return "Function invocation failed";
}

export async function createCheckout(
  supabase: SupabaseClient,
  options: CreateCheckoutOptions = {},
): Promise<void> {
  await ensureMercadoPagoSecurityLoaded().catch(() => undefined);

  const returnUrls = buildPaymentReturnUrls({
    purchaseType: options.purchaseType,
    provider: "mercadopago",
    tier: options.tier,
  });

  const { data, error } = await supabase.functions.invoke(
    "mercado-pago-preference",
    {
      body: {
        tier: options.tier ?? "Master Builder",
        title: options.title,
        description: options.description,
        item_id: options.itemId,
        amount: options.amount,
        currency: options.currency,
        user_id: options.userId,
        user_email: options.userEmail,
        billing_mode: options.billingMode,
        billing_interval: options.billingInterval,
        purchase_type: options.purchaseType,
        credits_amount: options.creditsAmount,
        credit_pack_id: options.creditPackId,
        environment: shouldUseMercadoPagoTestEnvironment() ? "test" : undefined,
        device_id: options.deviceId ?? getMercadoPagoDeviceId(),
        back_url_success: options.backUrlSuccess ?? returnUrls.success,
        back_url_failure: options.backUrlFailure ?? returnUrls.failure,
        back_url_pending: options.backUrlPending ?? returnUrls.pending,
      },
    },
  );

  if (error) {
    throw new Error(await resolveFunctionErrorMessage(error));
  }

  const { init_point, error: logicError } = data || {};

  if (logicError) {
    throw new Error(logicError);
  }

  if (!init_point) {
    throw new Error("No checkout URL returned");
  }

  // Track checkout started
  // We don't await this to avoid delaying redirect, and we catch errors silently (implied by trackEvent)
  trackEvent("checkout_started", {
    tier: options.tier,
    provider: "mercadopago",
    billing_mode: options.billingMode ?? "one_time",
    purchase_type: options.purchaseType ?? "tier",
    credits_amount: options.creditsAmount,
    credit_pack_id: options.creditPackId,
  });

  // Open in new tab so the app tab stays open; back button and return URL work correctly
  window.open(init_point, "_blank", "noopener,noreferrer");
}

export async function createSubscription(
  supabase: SupabaseClient,
  options: CreateSubscriptionOptions,
): Promise<CreateSubscriptionResult> {
  await ensureMercadoPagoSecurityLoaded().catch(() => undefined);

  const returnUrls = buildPaymentReturnUrls({
    purchaseType: "tier",
    provider: "mercadopago",
    tier: options.tier,
  });

  const { data, error } = await supabase.functions.invoke(
    "mercado-pago-preference",
    {
      body: {
        tier: options.tier,
        title: options.title,
        amount: options.amount,
        currency: options.currency,
        user_id: options.userId,
        user_email: options.userEmail,
        billing_mode: "subscription",
        billing_interval: options.billingInterval,
        purchase_type: "tier",
        card_token_id: options.cardTokenId,
        environment: shouldUseMercadoPagoTestEnvironment() ? "test" : undefined,
        device_id: options.deviceId ?? getMercadoPagoDeviceId(),
        back_url_success: options.backUrlSuccess ?? returnUrls.success,
        back_url_failure: options.backUrlFailure ?? returnUrls.failure,
        back_url_pending: options.backUrlPending ?? returnUrls.pending,
      },
    },
  );

  if (error) {
    throw new Error(await resolveFunctionErrorMessage(error));
  }

  const {
    subscription_id: subscriptionId,
    status,
    checkout_mode: checkoutMode,
    init_point: initPoint,
    error: logicError,
  } = data || {};

  if (logicError) {
    throw new Error(logicError);
  }

  if (initPoint) {
    window.open(initPoint, "_blank", "noopener,noreferrer");
  }

  if (!subscriptionId && !initPoint) {
    throw new Error("No subscription confirmation returned");
  }

  trackEvent("checkout_started", {
    tier: options.tier,
    provider: "mercadopago",
    billing_mode: "subscription",
    purchase_type: "tier",
  });

  return {
    subscriptionId,
    status,
    checkoutMode,
  };
}
