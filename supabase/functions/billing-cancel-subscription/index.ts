import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const LEMONSQUEEZY_API_KEY = Deno.env.get("LEMONSQUEEZY_API_KEY")?.trim() ?? "";
const MERCADOPAGO_ACCESS_TOKEN =
  Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")?.trim() ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "apikey, X-Client-Info, Content-Type, Authorization, Accept",
};

interface CancelRequestBody {
  provider?: string;
  subscription_id?: string;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
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

function titleCase(value: string | null): string | null {
  if (!value) return null;
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeMercadoPagoSubscriptionStatus(status: string | null): string {
  const normalized = status?.toLowerCase() ?? "pending";
  if (normalized === "authorized") return "active";
  if (normalized === "paused") return "paused";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "pending") return "pending";
  return normalized;
}

async function cancelLemonSqueezySubscription(
  subscriptionId: string,
): Promise<Record<string, unknown>> {
  if (!LEMONSQUEEZY_API_KEY) {
    throw new Error("LEMONSQUEEZY_API_KEY not configured");
  }

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
      },
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.errors?.[0]?.detail ??
      payload?.errors?.[0]?.title ??
      "Failed to cancel Lemon Squeezy subscription";
    throw new Error(message);
  }

  return (payload?.data?.attributes ?? {}) as Record<string, unknown>;
}

async function cancelMercadoPagoSubscription(
  subscriptionId: string,
): Promise<Record<string, unknown>> {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
  }

  const response = await fetch(
    `https://api.mercadopago.com/preapproval/${subscriptionId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.message ??
      payload?.error ??
      "Failed to cancel MercadoPago subscription";
    throw new Error(message);
  }

  return payload as Record<string, unknown>;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization" }, 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const body = (await req.json()) as CancelRequestBody;
    const provider = asString(body.provider)?.toLowerCase();
    const requestedSubscriptionId = asString(body.subscription_id);

    if (!provider || !requestedSubscriptionId) {
      return jsonResponse(
        { error: "provider and subscription_id are required" },
        400,
      );
    }

    const { data: subscription, error: subscriptionError } = await serviceClient
      .from("billing_subscriptions")
      .select("provider, provider_subscription_id, status, renews_at, ends_at")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .eq("provider_subscription_id", requestedSubscriptionId)
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Failed to load billing subscription before cancel:",
        subscriptionError,
      );
      return jsonResponse({ error: "Failed to load subscription" }, 500);
    }

    if (!subscription) {
      return jsonResponse({ error: "Subscription not found" }, 404);
    }

    if ((subscription.status ?? "").toLowerCase() === "cancelled") {
      return jsonResponse({
        ok: true,
        subscription: {
          provider,
          status: "cancelled",
          status_formatted: "Cancelled",
          cancel_requested: true,
          renews_at: subscription.renews_at,
          ends_at: subscription.ends_at,
        },
      });
    }

    let updatedStatus = "cancelled";
    let updatedStatusFormatted = "Cancelled";
    let updatedRenewsAt = subscription.renews_at ?? null;
    let updatedEndsAt = subscription.ends_at ?? null;
    let updatedMetadata: Record<string, unknown> | null = null;

    if (provider === "lemonsqueezy") {
      const attrs = await cancelLemonSqueezySubscription(
        requestedSubscriptionId,
      );
      updatedStatus = asString(attrs.status) ?? "cancelled";
      updatedStatusFormatted =
        asString(attrs.status_formatted) ??
        titleCase(updatedStatus) ??
        "Cancelled";
      updatedRenewsAt = asIsoString(attrs.renews_at) ?? updatedRenewsAt;
      updatedEndsAt =
        asIsoString(attrs.ends_at) ?? updatedEndsAt ?? updatedRenewsAt;
      updatedMetadata = attrs;
    } else if (provider === "mercadopago") {
      const payload = await cancelMercadoPagoSubscription(
        requestedSubscriptionId,
      );
      updatedStatus = normalizeMercadoPagoSubscriptionStatus(
        asString(payload.status),
      );
      updatedStatusFormatted = titleCase(updatedStatus) ?? "Cancelled";
      updatedRenewsAt =
        asIsoString(payload.next_payment_date) ?? updatedRenewsAt;
      updatedEndsAt =
        asIsoString(payload.date_of_end) ?? updatedEndsAt ?? updatedRenewsAt;
      updatedMetadata = payload;
    } else {
      return jsonResponse({ error: "Unsupported billing provider" }, 400);
    }

    const { error: updateError } = await serviceClient
      .from("billing_subscriptions")
      .update({
        status: updatedStatus,
        status_formatted: updatedStatusFormatted,
        cancel_requested: true,
        renews_at: updatedRenewsAt,
        ends_at: updatedEndsAt,
        metadata: updatedMetadata ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("provider", provider)
      .eq("provider_subscription_id", requestedSubscriptionId);

    if (updateError) {
      console.error(
        "Failed to update billing_subscriptions after cancel:",
        updateError,
      );
      return jsonResponse(
        { error: "Failed to update subscription state" },
        500,
      );
    }

    const { error: syncError } = await serviceClient.rpc(
      "sync_profile_tier_from_billing",
      {
        target_user_id: user.id,
      },
    );
    if (syncError) {
      console.error("Failed to sync profile tier after cancel:", syncError);
      return jsonResponse({ error: "Failed to sync profile tier" }, 500);
    }

    return jsonResponse({
      ok: true,
      subscription: {
        provider,
        status: updatedStatus,
        status_formatted: updatedStatusFormatted,
        cancel_requested: true,
        renews_at: updatedRenewsAt,
        ends_at: updatedEndsAt,
      },
    });
  } catch (error) {
    console.error("billing-cancel-subscription error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
