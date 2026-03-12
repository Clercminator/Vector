// Supabase Edge Function: Create Lemon Squeezy checkout
// Calls Lemon Squeezy API to create a checkout with user_id in custom data.
// Set in Supabase Secrets: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID,
// LEMONSQUEEZY_VARIANT_STANDARD (variant ID for Builder), LEMONSQUEEZY_VARIANT_MAX (variant ID for Max)

const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, X-Client-Info, Content-Type, Authorization, Accept",
};

interface Body {
  tier?: string;
  user_id?: string;
  user_email?: string;
  redirect_url?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
  const storeId = Deno.env.get("LEMONSQUEEZY_STORE_ID");
  const variantStandard =
    Deno.env.get("LEMONSQUEEZY_VARIANT_STANDARD") ?? Deno.env.get("LEMONSQUEEZY_VARIANT_BUILDER");
  const variantMax = Deno.env.get("LEMONSQUEEZY_VARIANT_MAX");

  if (!apiKey?.trim() || !storeId?.trim()) {
    return new Response(
      JSON.stringify({ error: "LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json()) as Body;
    const tier = body.tier ?? "standard";
    const userId = body.user_id;
    const userEmail = body.user_email ?? "";
    const redirectUrl = body.redirect_url ?? "https://vectorplan.xyz/dashboard?payment=success";

    const variantId = tier === "max" ? variantMax : variantStandard;
    if (!variantId?.trim()) {
      return new Response(
        JSON.stringify({
          error: `Variant for tier "${tier}" not configured. Set LEMONSQUEEZY_VARIANT_STANDARD and LEMONSQUEEZY_VARIANT_MAX in Supabase Secrets.`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            redirect_url: redirectUrl,
          },
          checkout_data: {
            email: userEmail,
            custom: userId ? { user_id: userId } : {},
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    };

    const res = await fetch(`${LEMONSQUEEZY_API}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.errors?.[0]?.detail ?? data?.errors?.[0]?.title ?? "Lemon Squeezy API error";
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const checkoutUrl = data?.data?.attributes?.url;
    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({ error: "No checkout URL in response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ checkout_url: checkoutUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
