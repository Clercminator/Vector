/**
 * MercadoPago checkout helper.
 * Calls the Supabase Edge Function to create a payment preference and redirects to MercadoPago Checkout.
 * Public Key is used only for frontend SDK (e.g. Bricks) if needed; redirect flow uses only the backend.
 */

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

export interface CreateCheckoutOptions {
  tier?: string;
  title?: string;
  amount?: number;
  currency?: string;
  userId?: string;
}

/**
 * Creates a MercadoPago checkout preference via the Edge Function and redirects the user to MercadoPago.
 * Requires: VITE_SUPABASE_URL (or VITE_supabase_url) set, and mercado-pago-preference Edge Function deployed with MERCADOPAGO_ACCESS_TOKEN in Secrets.
 */
import { SupabaseClient } from "@supabase/supabase-js";

export async function createCheckout(supabase: SupabaseClient, options: CreateCheckoutOptions = {}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('mercado-pago-preference', {
    body: {
      tier: options.tier ?? "Master Builder",
      title: options.title,
      amount: options.amount,
      currency: options.currency,
      user_id: options.userId,
      back_url_success: window.location.origin + "/dashboard?payment=success",
      back_url_failure: window.location.origin + "/pricing?payment=failure",
      back_url_pending: window.location.origin + "/dashboard?payment=pending",
    }
  });

  if (error) {
    throw new Error(error.message || "Function invocation failed");
  }

  const { init_point, error: logicError } = data || {};

  if (logicError) {
    throw new Error(logicError);
  }

  if (!init_point) {
    throw new Error("No checkout URL returned");
  }

  // Open in new tab so the app tab stays open; back button and return URL work correctly
  window.open(init_point, '_blank', 'noopener,noreferrer');
}
