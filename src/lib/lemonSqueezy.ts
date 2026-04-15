/**
 * Lemon Squeezy checkout for US/EU users.
 * Creates checkout via Supabase Edge Function, then redirects to Lemon Squeezy.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { trackEvent } from "./analytics";
import { buildPaymentReturnUrls } from "./mercadoPago";
import { resolvePaymentReturnPaths } from "./paymentReturn";

const LEMONSQUEEZY_ENV_QUERY_PARAM = "ls_env";
const LEMONSQUEEZY_ENV_STORAGE_KEY = "vector.lemonsqueezy.environment";

type LemonSqueezyEnvironmentMode = "live" | "test";

const getBrowserHostname = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname.toLowerCase();
};

function getLemonSqueezyEnvironmentOverride(): LemonSqueezyEnvironmentMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params
      .get(LEMONSQUEEZY_ENV_QUERY_PARAM)
      ?.trim()
      .toLowerCase();

    if (queryValue === "test" || queryValue === "live") {
      window.localStorage.setItem(LEMONSQUEEZY_ENV_STORAGE_KEY, queryValue);
      return queryValue;
    }

    const storedValue = window.localStorage
      .getItem(LEMONSQUEEZY_ENV_STORAGE_KEY)
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

export function shouldUseLemonSqueezyTestEnvironment(): boolean {
  const forcedEnvironment =
    (import.meta.env.VITE_LEMONSQUEEZY_ENVIRONMENT as string | undefined) ?? "";
  const normalizedForcedEnvironment = forcedEnvironment.trim().toLowerCase();

  if (normalizedForcedEnvironment === "test") {
    return true;
  }
  if (normalizedForcedEnvironment === "live") {
    return false;
  }

  const environmentOverride = getLemonSqueezyEnvironmentOverride();
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

export function isLemonSqueezyConfigured(): boolean {
  return Boolean(getSupabaseUrl().trim());
}

export interface CreateLemonSqueezyCheckoutOptions {
  tier: "builder" | "max";
  userId: string;
  userEmail?: string;
}

export async function createLemonSqueezyCheckout(
  supabase: SupabaseClient,
  options: CreateLemonSqueezyCheckoutOptions,
): Promise<void> {
  const { successPath } = resolvePaymentReturnPaths({
    purchaseType: "tier",
    provider: "lemonsqueezy",
  });
  const returnUrls = buildPaymentReturnUrls({
    purchaseType: "tier",
    provider: "lemonsqueezy",
    tier: options.tier,
    successPath,
  });

  const { data, error } = await supabase.functions.invoke(
    "lemonsqueezy-checkout",
    {
      body: {
        tier: options.tier,
        user_id: options.userId,
        user_email: options.userEmail,
        redirect_url: returnUrls.success,
        environment: shouldUseLemonSqueezyTestEnvironment()
          ? "test"
          : undefined,
      },
    },
  );

  if (error) {
    throw new Error(error.message || "Failed to create checkout");
  }

  const { checkout_url, error: logicError } = data || {};

  if (logicError) {
    throw new Error(logicError);
  }

  if (!checkout_url) {
    throw new Error("No checkout URL returned");
  }

  trackEvent("checkout_started", {
    tier: options.tier,
    provider: "lemonsqueezy",
    environment: shouldUseLemonSqueezyTestEnvironment() ? "test" : "live",
  });

  window.open(checkout_url, "_blank", "noopener,noreferrer");
}
