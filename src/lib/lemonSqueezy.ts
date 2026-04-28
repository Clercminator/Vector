/**
 * Lemon Squeezy checkout for US/EU users.
 * Creates checkout via Supabase Edge Function, then redirects to Lemon Squeezy.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { trackEvent } from "./analytics";
import {
  createPendingPaymentSyncRecord,
  resolvePaymentReturnPaths,
  writePendingPaymentSyncRecord,
} from "./paymentReturn";
import { buildPaymentReturnUrls } from "./paymentReturnUrls";
import { shouldUseLemonSqueezyTestEnvironment } from "./paymentProviderConfig";

export {
  isLemonSqueezyConfigured,
  shouldDefaultLemonSqueezyToTestForHostname,
  shouldUseLemonSqueezyTestEnvironment,
} from "./paymentProviderConfig";

export interface CreateLemonSqueezyCheckoutOptions {
  tier: "builder" | "max";
  userId: string;
  userEmail?: string;
  currentTier?: string;
  currentCredits?: number;
  currentExtraCredits?: number;
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

  const pendingPaymentSync = createPendingPaymentSyncRecord({
    provider: "lemonsqueezy",
    purchaseType: "tier",
    tier: options.tier,
    currentTier: options.currentTier ?? null,
    currentCredits: options.currentCredits ?? null,
    currentExtraCredits: options.currentExtraCredits ?? null,
  });

  if (pendingPaymentSync) {
    writePendingPaymentSyncRecord(pendingPaymentSync);
  }

  trackEvent("checkout_started", {
    tier: options.tier,
    provider: "lemonsqueezy",
    environment: shouldUseLemonSqueezyTestEnvironment() ? "test" : "live",
  });

  window.open(checkout_url, "_blank", "noopener,noreferrer");
}
