// Supabase Edge Function: MercadoPago payment preference
// Creates a checkout preference using MERCADOPAGO_ACCESS_TOKEN from Secrets.
// Returns init_point so the frontend can redirect the user to MercadoPago Checkout.
// Set MERCADOPAGO_ACCESS_TOKEN in Supabase Dashboard → Edge Functions → Secrets.

const MERCADOPAGO_PREFERENCES_URL =
  "https://api.mercadopago.com/checkout/preferences";
const MERCADOPAGO_PREAPPROVAL_URL = "https://api.mercadopago.com/preapproval";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "apikey, X-Client-Info, Content-Type, Authorization, Accept, Accept-Language, X-Client-Version",
};

interface PreferenceBody {
  tier?: string;
  title?: string;
  amount?: number;
  currency?: string;
  billing_mode?: "one_time" | "subscription";
  billing_interval?: "month" | "year";
  purchase_type?: "tier" | "extra_credits";
  credits_amount?: number;
  credit_pack_id?: "credits_5" | "credits_20";
  user_email?: string;
  back_url_success?: string;
  back_url_failure?: string;
  back_url_pending?: string;
  user_id?: string;
}

const EXTRA_CREDIT_PACKS = {
  credits_5: {
    title: "Vector - 5 Extra Plans",
    amount: 5.99,
    currency: "USD",
    credits: 5,
  },
  credits_20: {
    title: "Vector - 20 Extra Plans",
    amount: 15.99,
    currency: "USD",
    credits: 20,
  },
} as const;

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

  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const planBuilderId =
    Deno.env.get("MERCADOPAGO_PLAN_BUILDER_ID")?.trim() ?? "";
  const planMaxId = Deno.env.get("MERCADOPAGO_PLAN_MAX_ID")?.trim() ?? "";
  if (!accessToken?.trim()) {
    return new Response(
      JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = (await req.json()) as PreferenceBody;
    const tier = body.tier ?? "Master Builder";
    const title = body.title ?? `Vector — ${tier}`;
    const amount =
      typeof body.amount === "number" && body.amount > 0 ? body.amount : 19;
    const currency = body.currency ?? "USD";
    const billingMode = body.billing_mode ?? "one_time";
    const purchaseType = body.purchase_type ?? "tier";
    const origin = req.headers.get("origin") ?? "https://localhost:5173";
    const backUrlSuccess =
      body.back_url_success ?? `${origin}/dashboard?payment=success`;
    const backUrlFailure =
      body.back_url_failure ?? `${origin}/pricing?payment=failure`;
    const backUrlPending =
      body.back_url_pending ?? `${origin}/dashboard?payment=pending`;
    const userId = body.user_id;
    const userEmail = body.user_email?.trim() || undefined;

    if (billingMode === "subscription") {
      const normalizedTier = tier.toLowerCase();
      const preapprovalPlanId =
        normalizedTier === "max" ? planMaxId : planBuilderId;
      if (!preapprovalPlanId) {
        return new Response(
          JSON.stringify({
            error: `MercadoPago plan ID for tier "${tier}" is not configured. Set MERCADOPAGO_PLAN_BUILDER_ID and MERCADOPAGO_PLAN_MAX_ID in Supabase secrets.`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const subscriptionRes = await fetch(MERCADOPAGO_PREAPPROVAL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preapproval_plan_id: preapprovalPlanId,
          reason: title,
          external_reference: userId,
          payer_email: userEmail,
          back_url: backUrlSuccess,
          status: "pending",
        }),
      });

      const subscriptionData = await subscriptionRes.json();

      if (!subscriptionRes.ok) {
        return new Response(
          JSON.stringify({
            error:
              subscriptionData.message ?? "MercadoPago subscription API error",
            details: subscriptionData,
          }),
          {
            status: subscriptionRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const initPoint = (subscriptionData as { init_point?: string })
        .init_point;
      if (!initPoint) {
        return new Response(
          JSON.stringify({
            error: "No init_point in MercadoPago subscription response",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          init_point: initPoint,
          subscription_id: (subscriptionData as { id?: string }).id,
          checkout_mode: "subscription",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!userId) {
      console.warn(
        "Creating preference without user_id - webhook will not be able to upgrade user automatically.",
      );
    }

    const validatedOneTimePack =
      billingMode === "one_time" && purchaseType === "extra_credits"
        ? EXTRA_CREDIT_PACKS[body.credit_pack_id ?? "credits_5"]
        : null;

    if (
      billingMode === "one_time" &&
      purchaseType === "extra_credits" &&
      !validatedOneTimePack
    ) {
      return new Response(
        JSON.stringify({ error: "Unsupported extra credit pack requested." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const preference = {
      items: [
        {
          title: validatedOneTimePack?.title ?? title,
          quantity: 1,
          unit_price: validatedOneTimePack?.amount ?? amount,
          currency_id: validatedOneTimePack?.currency ?? currency,
        },
      ],
      back_urls: {
        success: backUrlSuccess,
        failure: backUrlFailure,
        pending: backUrlPending,
      },
      auto_return: "approved" as const,
      external_reference: userId,
      metadata: {
        purchase_type: purchaseType,
        credits_amount:
          validatedOneTimePack?.credits ?? body.credits_amount ?? null,
        credit_pack_id: body.credit_pack_id ?? null,
        vector_tier: body.tier ?? null,
      },
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
        JSON.stringify({
          error: data.message ?? "MercadoPago API error",
          details: data,
        }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const initPoint = (data as { init_point?: string }).init_point;
    if (!initPoint) {
      return new Response(
        JSON.stringify({ error: "No init_point in response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        init_point: initPoint,
        preference_id: (data as { id?: string }).id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
