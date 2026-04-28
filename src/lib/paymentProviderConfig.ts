const MERCADOPAGO_ENV_QUERY_PARAM = "mp_env";
const MERCADOPAGO_ENV_STORAGE_KEY = "vector.mercadopago.environment";
const LEMONSQUEEZY_ENV_QUERY_PARAM = "ls_env";
const LEMONSQUEEZY_ENV_STORAGE_KEY = "vector.lemonsqueezy.environment";

type PaymentEnvironmentMode = "live" | "test";

function getBrowserHostname(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname.toLowerCase();
}

function getEnvironmentOverride(
  queryParam: string,
  storageKey: string,
): PaymentEnvironmentMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(queryParam)?.trim().toLowerCase();

    if (queryValue === "test" || queryValue === "live") {
      window.localStorage.setItem(storageKey, queryValue);
      return queryValue;
    }

    const storedValue = window.localStorage
      .getItem(storageKey)
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

function getSupabaseUrl(): string {
  const url =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
    (import.meta.env.VITE_supabase_url as string | undefined) ??
    "";
  return url.replace(/\/$/, "");
}

export function shouldDefaultLemonSqueezyToTestForHostname(
  hostname: string,
): boolean {
  const normalizedHostname = hostname.trim().toLowerCase();

  if (!normalizedHostname) {
    return false;
  }

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "::1"
  ) {
    return true;
  }

  return (
    normalizedHostname.endsWith(".vercel.app") &&
    (normalizedHostname.includes("-git-") ||
      normalizedHostname.includes("-preview-"))
  );
}

export function shouldUseLemonSqueezyTestEnvironment(): boolean {
  const forcedEnvironment =
    (import.meta.env.VITE_LEMONSQUEEZY_ENVIRONMENT as string | undefined) ??
    "";
  const normalizedForcedEnvironment = forcedEnvironment.trim().toLowerCase();

  if (normalizedForcedEnvironment === "test") {
    return true;
  }
  if (normalizedForcedEnvironment === "live") {
    return false;
  }

  const environmentOverride = getEnvironmentOverride(
    LEMONSQUEEZY_ENV_QUERY_PARAM,
    LEMONSQUEEZY_ENV_STORAGE_KEY,
  );
  if (environmentOverride === "test") {
    return true;
  }
  if (environmentOverride === "live") {
    return false;
  }

  return shouldDefaultLemonSqueezyToTestForHostname(getBrowserHostname());
}

export function isLemonSqueezyConfigured(): boolean {
  return Boolean(getSupabaseUrl().trim());
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

  const environmentOverride = getEnvironmentOverride(
    MERCADOPAGO_ENV_QUERY_PARAM,
    MERCADOPAGO_ENV_STORAGE_KEY,
  );
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

export function isMercadoPagoConfigured(): boolean {
  return Boolean(getSupabaseUrl().trim());
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