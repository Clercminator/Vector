// Supabase Edge Function: Lemon Squeezy Webhook
// Tracks recurring subscription lifecycle state and applies monthly plan credits on successful subscription invoices.
// Set LEMONSQUEEZY_WEBHOOK_SECRET in Supabase Secrets (same as signing secret in Lemon Squeezy dashboard).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BUILDER_VARIANT_ID =
  (
    Deno.env.get("LEMONSQUEEZY_VARIANT_STANDARD") ??
    Deno.env.get("LEMONSQUEEZY_VARIANT_BUILDER")
  )?.trim() ?? "";
const MAX_VARIANT_ID = Deno.env.get("LEMONSQUEEZY_VARIANT_MAX")?.trim() ?? "";
const BUILDER_VARIANT_ID_TESTING =
  (
    Deno.env.get("LEMONSQUEEZY_VARIANT_STANDARD_TESTING") ??
    Deno.env.get("LEMONSQUEEZY_VARIANT_BUILDER_TESTING")
  )?.trim() ?? "";
const MAX_VARIANT_ID_TESTING =
  Deno.env.get("LEMONSQUEEZY_VARIANT_MAX_TESTING")?.trim() ?? "";

type PaidTierId = "builder" | "max";

const SUBSCRIPTION_STATE_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
]);

const SUBSCRIPTION_PAYMENT_EVENTS = new Set([
  "subscription_payment_success",
  "subscription_payment_recovered",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Signature, X-Event-Name",
};

function okResponse() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function asIsoString(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function centsToUnits(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount / 100 : 0;
}

function inferTierFromVariant(
  variantId: unknown,
  variantName: unknown,
): PaidTierId {
  const normalizedVariantId = asString(variantId);
  const normalizedVariantName = asString(variantName)?.toLowerCase() ?? "";

  if (
    normalizedVariantId &&
    MAX_VARIANT_ID &&
    normalizedVariantId === MAX_VARIANT_ID
  ) {
    return "max";
  }
  if (
    normalizedVariantId &&
    MAX_VARIANT_ID_TESTING &&
    normalizedVariantId === MAX_VARIANT_ID_TESTING
  ) {
    return "max";
  }
  if (
    normalizedVariantId &&
    BUILDER_VARIANT_ID &&
    normalizedVariantId === BUILDER_VARIANT_ID
  ) {
    return "builder";
  }
  if (
    normalizedVariantId &&
    BUILDER_VARIANT_ID_TESTING &&
    normalizedVariantId === BUILDER_VARIANT_ID_TESTING
  ) {
    return "builder";
  }
  if (normalizedVariantName.includes("max")) {
    return "max";
  }
  return "builder";
}

function inferTierFromAmount(amountUsd: number): PaidTierId {
  return amountUsd >= 10 ? "max" : "builder";
}

function creditsForTier(tier: PaidTierId): number {
  return tier === "max" ? 20 : 5;
}

async function findUserIdByEmail(
  userEmail: string | null,
): Promise<string | null> {
  if (!userEmail) return null;

  const { data } = await supabase.auth.admin.listUsers();
  const match = data?.users?.find(
    (user) => user.email?.toLowerCase() === userEmail.toLowerCase(),
  );
  return match?.id ?? null;
}

async function findUserIdBySubscriptionId(
  subscriptionId: string | null,
): Promise<string | null> {
  if (!subscriptionId) return null;

  const { data } = await supabase
    .from("billing_subscriptions")
    .select("user_id")
    .eq("provider", "lemonsqueezy")
    .eq("provider_subscription_id", subscriptionId)
    .limit(1)
    .maybeSingle();

  return data?.user_id ?? null;
}

async function resolveTargetUserId(options: {
  explicitUserId?: unknown;
  subscriptionId?: string | null;
  userEmail?: string | null;
}): Promise<string | null> {
  const explicitUserId = asString(options.explicitUserId);
  if (explicitUserId) return explicitUserId;

  const bySubscription = await findUserIdBySubscriptionId(
    options.subscriptionId ?? null,
  );
  if (bySubscription) return bySubscription;

  return findUserIdByEmail(options.userEmail ?? null);
}

async function syncSubscriptionRecord(params: {
  userId: string;
  subscriptionId: string;
  attributes: Record<string, unknown>;
  metadata: unknown;
}): Promise<PaidTierId> {
  const attrs = params.attributes;
  const tier = inferTierFromVariant(attrs.variant_id, attrs.variant_name);

  const { error } = await supabase.from("billing_subscriptions").upsert(
    {
      user_id: params.userId,
      provider: "lemonsqueezy",
      provider_subscription_id: params.subscriptionId,
      provider_customer_id: asString(attrs.customer_id),
      tier,
      status: asString(attrs.status) ?? "pending",
      status_formatted: asString(attrs.status_formatted),
      billing_interval: "month",
      product_name: asString(attrs.product_name),
      variant_name: asString(attrs.variant_name),
      user_email: asString(attrs.user_email),
      order_id: asString(attrs.order_id),
      order_item_id: asString(attrs.order_item_id),
      variant_id: asString(attrs.variant_id),
      renews_at: asIsoString(attrs.renews_at),
      ends_at: asIsoString(attrs.ends_at),
      trial_ends_at: asIsoString(attrs.trial_ends_at),
      paused:
        (asString(attrs.status) ?? "") === "paused" || attrs.pause != null,
      cancel_requested: Boolean(attrs.cancelled),
      metadata: params.metadata,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,provider_subscription_id" },
  );

  if (error) {
    console.error("Failed to upsert billing subscription:", error);
    throw new Error("Failed to sync subscription state");
  }

  const { error: syncError } = await supabase.rpc(
    "sync_profile_tier_from_billing",
    {
      target_user_id: params.userId,
    },
  );
  if (syncError) {
    console.error("Failed to sync profile tier from billing:", syncError);
    throw new Error("Failed to sync profile tier");
  }

  return tier;
}

async function getSubscriptionCycleEnd(
  subscriptionId: string | null,
  fallbackIso: string | null,
): Promise<string | null> {
  if (!subscriptionId) return fallbackIso;

  const { data } = await supabase
    .from("billing_subscriptions")
    .select("renews_at, ends_at")
    .eq("provider", "lemonsqueezy")
    .eq("provider_subscription_id", subscriptionId)
    .limit(1)
    .maybeSingle();

  return data?.renews_at ?? data?.ends_at ?? fallbackIso;
}

async function trackReferredPayment(params: {
  userId: string;
  amount: number;
  currency: string;
  tier: PaidTierId;
  paymentId: string;
}) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("referrer_code")
    .eq("user_id", params.userId)
    .single();

  if (!profile?.referrer_code) return;

  await supabase.from("analytics_events").insert({
    user_id: params.userId,
    event_type: "payment_referred",
    data: {
      referrer_code: profile.referrer_code,
      amount: params.amount,
      currency: params.currency,
      tier: params.tier,
      payment_id: params.paymentId,
    },
  });
}

async function sendBillingEmail(params: {
  userEmail: string | null;
  tier: PaidTierId;
  creditsToAdd: number;
}) {
  if (!params.userEmail) return;

  const tierLabel = params.tier.charAt(0).toUpperCase() + params.tier.slice(1);
  fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: params.userEmail,
      subject: `Vector Billing Confirmation - ${tierLabel}`,
      html: `<h1>Payment received</h1><p>Your <strong>${params.tier}</strong> subscription payment was processed successfully.</p><p>Your included plan credits have been reset to <strong>${params.creditsToAdd}</strong> for the current billing cycle.</p><p>Go to <a href="https://vectorplan.xyz/dashboard">Vector Dashboard</a> to continue building.</p>`,
    }),
  }).catch((error) => console.error("Failed to send billing email:", error));
}

async function verifySignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!WEBHOOK_SECRET?.trim() || !signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
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

  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature");
  const eventName = req.headers.get("X-Event-Name");

  if (!(await verifySignature(rawBody, signature))) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = JSON.parse(rawBody);
    const attrs = (body?.data?.attributes ?? {}) as Record<string, unknown>;
    const customData = body?.meta?.custom_data ?? {};

    if (!eventName) {
      return okResponse();
    }

    // Subscription products now grant access on subscription lifecycle events and invoice payments.
    // order_created remains noisy for subscriptions and would double-apply the initial purchase.
    if (eventName === "order_created") {
      return okResponse();
    }

    if (SUBSCRIPTION_STATE_EVENTS.has(eventName)) {
      const subscriptionId = asString(body?.data?.id);
      const userEmail = asString(attrs.user_email);
      const targetUserId = await resolveTargetUserId({
        explicitUserId: customData.user_id,
        subscriptionId,
        userEmail,
      });

      if (!subscriptionId || !targetUserId) {
        console.warn("Unable to map subscription webhook to a Vector user", {
          eventName,
          subscriptionId,
          userEmail,
        });
        return okResponse();
      }

      await syncSubscriptionRecord({
        userId: targetUserId,
        subscriptionId,
        attributes: attrs,
        metadata: body,
      });

      return okResponse();
    }

    if (SUBSCRIPTION_PAYMENT_EVENTS.has(eventName)) {
      if ((asString(attrs.status) ?? "") !== "paid") {
        return okResponse();
      }

      const providerPaymentId = asString(body?.data?.id);
      if (!providerPaymentId) {
        return okResponse();
      }

      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("provider", "lemonsqueezy")
        .eq("provider_payment_id", providerPaymentId)
        .limit(1)
        .maybeSingle();
      if (existing) {
        return okResponse();
      }

      const subscriptionId = asString(attrs.subscription_id);
      const userEmail = asString(attrs.user_email);
      const targetUserId = await resolveTargetUserId({
        explicitUserId: customData.user_id,
        subscriptionId,
        userEmail,
      });

      if (!targetUserId) {
        console.warn(
          "Unable to map subscription invoice webhook to a Vector user",
          {
            eventName,
            subscriptionId,
            userEmail,
          },
        );
        return okResponse();
      }

      const totalUsd = centsToUnits(attrs.total_usd ?? attrs.total);
      let tier: PaidTierId | null = null;

      if (subscriptionId) {
        const { data: existingSubscription } = await supabase
          .from("billing_subscriptions")
          .select("tier")
          .eq("provider", "lemonsqueezy")
          .eq("provider_subscription_id", subscriptionId)
          .limit(1)
          .maybeSingle();

        if (
          existingSubscription?.tier === "builder" ||
          existingSubscription?.tier === "max"
        ) {
          tier = existingSubscription.tier;
        }
      }

      tier ??= inferTierFromAmount(totalUsd);
      const creditsToAdd = creditsForTier(tier);
      const cycleEndsAt = await getSubscriptionCycleEnd(
        subscriptionId,
        asIsoString(attrs.created_at),
      );

      const { data: creditsAfter, error: creditsError } = await supabase.rpc(
        "apply_subscription_credits",
        {
          target_user_id: targetUserId,
          amount_to_add: creditsToAdd,
          cycle_ends_at: cycleEndsAt,
        },
      );
      if (creditsError || creditsAfter == null) {
        console.error(
          "Failed to apply subscription credits:",
          creditsError,
          "creditsAfter:",
          creditsAfter,
        );
        return new Response(
          JSON.stringify({ error: "Failed to update credits" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (subscriptionId) {
        const { error: syncError } = await supabase.rpc(
          "sync_profile_tier_from_billing",
          {
            target_user_id: targetUserId,
          },
        );
        if (syncError) {
          console.error(
            "Failed to sync profile tier after invoice payment:",
            syncError,
          );
          return new Response(
            JSON.stringify({ error: "Failed to update plan" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } else {
        const { error: tierError } = await supabase
          .from("profiles")
          .update({ tier })
          .eq("user_id", targetUserId);
        if (tierError) {
          console.error(
            "Failed to update profile tier without subscription record:",
            tierError,
          );
          return new Response(
            JSON.stringify({ error: "Failed to update plan" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      const currency = asString(attrs.currency) ?? "USD";
      const { error: payError } = await supabase.from("payments").insert({
        user_id: targetUserId,
        amount: totalUsd,
        currency,
        status: "approved",
        provider: "lemonsqueezy",
        provider_payment_id: providerPaymentId,
        tier,
        payment_type: "subscription_invoice",
        billing_interval: "month",
        billing_reason: asString(attrs.billing_reason),
        provider_subscription_id: subscriptionId,
        provider_customer_id: asString(attrs.customer_id),
        metadata: body,
      });
      if (payError) {
        console.error("Failed to insert subscription payment:", payError);
        return new Response(
          JSON.stringify({ error: "Failed to record payment" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      await trackReferredPayment({
        userId: targetUserId,
        amount: totalUsd,
        currency,
        tier,
        paymentId: providerPaymentId,
      });

      await sendBillingEmail({
        userEmail,
        tier,
        creditsToAdd,
      });

      return okResponse();
    }

    return okResponse();
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
