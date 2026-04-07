// Supabase Edge Function: Create Lemon Squeezy checkout
// Calls Lemon Squeezy API to create a checkout with user_id in custom data.
// Set in Supabase Secrets: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID,
// LEMONSQUEEZY_VARIANT_STANDARD (variant ID for Builder), LEMONSQUEEZY_VARIANT_MAX (variant ID for Max)

const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "apikey, X-Client-Info, Content-Type, Authorization, Accept",
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

  const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY")?.trim() ?? "";
  const storeId = Deno.env.get("LEMONSQUEEZY_STORE_ID")?.trim() ?? "";
  const variantStandard =
    (
      Deno.env.get("LEMONSQUEEZY_VARIANT_STANDARD") ??
      Deno.env.get("LEMONSQUEEZY_VARIANT_BUILDER")
    )?.trim() ?? "";
  const variantMax = Deno.env.get("LEMONSQUEEZY_VARIANT_MAX")?.trim() ?? "";

  if (!apiKey || !storeId) {
    return new Response(
      JSON.stringify({
        error: "LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID not configured",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = (await req.json()) as Body;
    // Default "builder"; legacy clients may still send "standard". Any non-max → Builder variant.
    const tierRaw = (body.tier ?? "builder").toLowerCase();
    const userId = body.user_id;
    const userEmail = body.user_email ?? "";
    const redirectUrl =
      body.redirect_url ?? "https://vectorplan.xyz/dashboard?payment=success";

    const variantId = tierRaw === "max" ? variantMax : variantStandard;
    if (!variantId) {
      return new Response(
        JSON.stringify({
          error: `Variant for tier "${tierRaw}" not configured. Set LEMONSQUEEZY_VARIANT_STANDARD and LEMONSQUEEZY_VARIANT_MAX in Supabase Secrets.`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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

    // Helpful for debugging 4xx/5xx from Lemon Squeezy without leaking secrets.
    console.log("lemonsqueezy-checkout request", {
      tier: tierRaw,
      hasApiKey: Boolean(apiKey?.trim()),
      storeIdConfigured: Boolean(storeId?.trim()),
      variantId: variantId ? String(variantId) : null,
      userIdProvided: Boolean(userId),
      userEmailProvided: Boolean(userEmail?.trim()),
      redirectUrlHost: (() => {
        try {
          return new URL(redirectUrl).host;
        } catch {
          return null;
        }
      })(),
    });

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
      const errMsg =
        data?.errors?.[0]?.detail ??
        data?.errors?.[0]?.title ??
        "Lemon Squeezy API error";
      console.error("lemonsqueezy-checkout Lemon Squeezy error", {
        status: res.status,
        title: data?.errors?.[0]?.title ?? null,
        detail: data?.errors?.[0]?.detail ?? null,
        // Keep response small; data might contain extra fields.
        identifiers: {
          storeId,
          variantId,
        },
      });
      return new Response(JSON.stringify({ error: errMsg }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutUrl = data?.data?.attributes?.url;
    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({ error: "No checkout URL in response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
