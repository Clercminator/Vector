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
}

/**
 * Creates a MercadoPago checkout preference via the Edge Function and redirects the user to MercadoPago.
 * Requires: VITE_SUPABASE_URL (or VITE_supabase_url) set, and mercado-pago-preference Edge Function deployed with MERCADOPAGO_ACCESS_TOKEN in Secrets.
 */
export async function createCheckout(options: CreateCheckoutOptions = {}, accessToken?: string): Promise<void> {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    throw new Error("VITE_SUPABASE_URL is not set. Cannot create MercadoPago checkout.");
  }

  const functionUrl = `${baseUrl}/functions/v1/mercado-pago-preference`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(functionUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      tier: options.tier ?? "Master Builder",
      title: options.title,
      amount: options.amount,
      currency: options.currency,
      back_url_success: window.location.origin + "/dashboard?payment=success",
      back_url_failure: window.location.origin + "/pricing?payment=failure",
      back_url_pending: window.location.origin + "/dashboard?payment=pending",
    }),
  });

  const data = (await res.json()) as { init_point?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? `Checkout failed (${res.status})`);
  }

  if (!data.init_point) {
    throw new Error("No checkout URL returned");
  }

  window.location.href = data.init_point;
}
