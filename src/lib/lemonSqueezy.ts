/**
 * Lemon Squeezy checkout for US/EU users.
 * Creates checkout via Supabase Edge Function, then redirects to Lemon Squeezy.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { trackEvent } from "./analytics";

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
  options: CreateLemonSqueezyCheckoutOptions
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("lemonsqueezy-checkout", {
    body: {
      tier: options.tier,
      user_id: options.userId,
      user_email: options.userEmail,
      redirect_url: `${window.location.origin}/dashboard?payment=success`,
    },
  });

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

  trackEvent("checkout_started", { tier: options.tier, provider: "lemonsqueezy" });

  window.open(checkout_url, "_blank", "noopener,noreferrer");
}
