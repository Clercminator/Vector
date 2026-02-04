// Supabase Edge Function: MercadoPago payment preference
// Creates a checkout preference using MERCADOPAGO_ACCESS_TOKEN from Secrets.
// Returns init_point so the frontend can redirect the user to MercadoPago Checkout.
// Set MERCADOPAGO_ACCESS_TOKEN in Supabase Dashboard → Edge Functions → Secrets.

const MERCADOPAGO_PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, x-client-version, apikey",
};

interface PreferenceBody {
  tier?: string;
  title?: string;
  amount?: number;
  currency?: string;
  back_url_success?: string;
  back_url_failure?: string;
  back_url_pending?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!accessToken?.trim()) {
    return new Response(
      JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json()) as PreferenceBody;
    const tier = body.tier ?? "Master Builder";
    const title = body.title ?? `Vector — ${tier}`;
    const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : 19;
    const currency = body.currency ?? "USD";
    const origin = req.headers.get("origin") ?? "https://localhost:5173";
    const backUrlSuccess = body.back_url_success ?? `${origin}/dashboard?payment=success`;
    const backUrlFailure = body.back_url_failure ?? `${origin}/pricing?payment=failure`;
    const backUrlPending = body.back_url_pending ?? `${origin}/dashboard?payment=pending`;

    const preference = {
      items: [
        {
          title,
          quantity: 1,
          unit_price: amount,
          currency_id: currency,
        },
      ],
      back_urls: {
        success: backUrlSuccess,
        failure: backUrlFailure,
        pending: backUrlPending,
      },
      auto_return: "approved" as const,
    };

    const res = await fetch(MERCADOPAGO_PREFERENCES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message ?? "MercadoPago API error", details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const initPoint = (data as { init_point?: string }).init_point;
    if (!initPoint) {
      return new Response(
        JSON.stringify({ error: "No init_point in response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ init_point: initPoint, preference_id: (data as { id?: string }).id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
