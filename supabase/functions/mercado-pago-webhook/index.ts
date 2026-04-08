// Supabase Edge Function: MercadoPago Webhook
// Handles both legacy one-time payments and recurring subscription webhooks.
// Recurring topics:
// - subscription_preapproval: subscription lifecycle state
// - subscription_authorized_payment: recurring invoice / charge

import { createClient } from "jsr:@supabase/supabase-js@2";

const MERCADOPAGO_ACCESS_TOKEN =
  Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")?.trim() ?? "";
const MERCADOPAGO_WEBHOOK_SECRET =
  Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET")?.trim() ?? "";
const MERCADOPAGO_PLAN_BUILDER_ID =
  Deno.env.get("MERCADOPAGO_PLAN_BUILDER_ID")?.trim() ?? "";
const MERCADOPAGO_PLAN_MAX_ID =
  Deno.env.get("MERCADOPAGO_PLAN_MAX_ID")?.trim() ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SUCCESSFUL_AUTHORIZED_PAYMENT_STATUSES = new Set([
  "authorized",
  "processed",
  "approved",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-signature, x-request-id",
};

type PaidTierId = "builder" | "max";

interface WebhookBody {
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string | number };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function okResponse() {
  return jsonResponse({ ok: true });
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

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }
  return null;
}

function titleCase(value: string | null): string | null {
  if (!value) return null;
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferTierFromAmount(amount: number | null): PaidTierId {
  return (amount ?? 0) >= 10 ? "max" : "builder";
}

function inferTierFromText(...values: unknown[]): PaidTierId | null {
  const normalized = values
    .map((value) => asString(value)?.toLowerCase())
    .filter((value): value is string => Boolean(value))
    .join(" ");

  if (normalized.includes("max")) return "max";
  if (normalized.includes("builder") || normalized.includes("standard"))
    return "builder";
  return null;
}

function inferTierFromPlanId(planId: string | null): PaidTierId | null {
  if (!planId) return null;
  if (MERCADOPAGO_PLAN_MAX_ID && planId === MERCADOPAGO_PLAN_MAX_ID)
    return "max";
  if (MERCADOPAGO_PLAN_BUILDER_ID && planId === MERCADOPAGO_PLAN_BUILDER_ID)
    return "builder";
  return null;
}

function creditsForTier(tier: PaidTierId): number {
  return tier === "max" ? 20 : 5;
}

function getLegacyPaymentMetadata(
  paymentData: Record<string, unknown>,
): Record<string, unknown> | null {
  const metadata = paymentData.metadata;
  if (typeof metadata === "object" && metadata !== null) {
    return metadata as Record<string, unknown>;
  }
  return null;
}

function getLegacyPaymentTitle(
  paymentData: Record<string, unknown>,
): string | null {
  const additionalInfo = paymentData.additional_info;
  if (typeof additionalInfo === "object" && additionalInfo !== null) {
    const items = (additionalInfo as Record<string, unknown>).items;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (typeof item === "object" && item !== null) {
          const title = pickString(
            (item as Record<string, unknown>).title,
            (item as Record<string, unknown>).description,
          );
          if (title) return title;
        }
      }
    }
  }

  return pickString(paymentData.description, paymentData.statement_descriptor);
}

function inferLegacyCreditPack(
  paymentData: Record<string, unknown>,
  amount: number,
): {
  purchaseType: "extra_credits" | "legacy_tier";
  creditsToAdd: number;
  tierHint: PaidTierId;
  productLabel: string;
} {
  const metadata = getLegacyPaymentMetadata(paymentData);
  const paymentTitle = getLegacyPaymentTitle(paymentData);
  const purchaseType = pickString(metadata?.purchase_type)?.toLowerCase();
  const metadataCredits = asNumber(metadata?.credits_amount);
  const tierHint =
    inferTierFromText(
      pickString(metadata?.vector_tier, metadata?.credit_pack_id, paymentTitle),
    ) ?? inferTierFromAmount(amount);

  if (purchaseType === "extra_credits") {
    const creditsToAdd = Math.max(
      1,
      Math.trunc(metadataCredits ?? creditsForTier(tierHint)),
    );
    return {
      purchaseType: "extra_credits",
      creditsToAdd,
      tierHint,
      productLabel: `${creditsToAdd} Extra Plans`,
    };
  }

  return {
    purchaseType: "legacy_tier",
    creditsToAdd: creditsForTier(tierHint),
    tierHint,
    productLabel: `Vector ${tierHint}`,
  };
}

function normalizeMercadoPagoSubscriptionStatus(status: string | null): string {
  const normalized = status?.toLowerCase() ?? "pending";
  if (normalized === "authorized") return "active";
  if (normalized === "paused") return "paused";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "pending") return "pending";
  return normalized;
}

async function findUserIdByEmail(
  userEmail: string | null,
): Promise<string | null> {
  if (!userEmail) return null;

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(
      "Failed to list users when resolving MercadoPago email:",
      error,
    );
    return null;
  }

  const match = data.users.find(
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
    .eq("provider", "mercadopago")
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

async function getExistingSubscriptionTier(
  subscriptionId: string | null,
): Promise<PaidTierId | null> {
  if (!subscriptionId) return null;

  const { data } = await supabase
    .from("billing_subscriptions")
    .select("tier")
    .eq("provider", "mercadopago")
    .eq("provider_subscription_id", subscriptionId)
    .limit(1)
    .maybeSingle();

  return data?.tier === "builder" || data?.tier === "max" ? data.tier : null;
}

async function verifySignature(
  req: Request,
  body: WebhookBody,
): Promise<boolean> {
  if (!MERCADOPAGO_WEBHOOK_SECRET) {
    return true;
  }

  const signatureHeader = req.headers.get("x-signature");
  if (!signatureHeader) {
    return false;
  }

  const parts = new Map<string, string>();
  for (const chunk of signatureHeader.split(",")) {
    const [key, value] = chunk.split("=", 2);
    if (key && value) {
      parts.set(key.trim(), value.trim());
    }
  }

  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) {
    return false;
  }

  const url = new URL(req.url);
  const dataId =
    pickString(url.searchParams.get("data.id"), body.data?.id)?.toLowerCase() ??
    null;
  const requestId = req.headers.get("x-request-id");

  const manifestParts: string[] = [];
  if (dataId) manifestParts.push(`id:${dataId};`);
  if (requestId) manifestParts.push(`request-id:${requestId};`);
  manifestParts.push(`ts:${ts};`);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(MERCADOPAGO_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(manifestParts.join("")),
  );
  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hex === v1;
}

async function fetchMercadoPagoJson(
  path: string,
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; body: string }
> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: {
      Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return { ok: false, status: response.status, body: await response.text() };
  }

  return { ok: true, data: (await response.json()) as Record<string, unknown> };
}

async function fetchSubscriptionPreapproval(
  subscriptionId: string,
): Promise<Record<string, unknown> | null> {
  const direct = await fetchMercadoPagoJson(`/preapproval/${subscriptionId}`);
  if (direct.ok) {
    return direct.data;
  }
  if (direct.status !== 404) {
    console.error(
      "Failed to fetch MercadoPago subscription",
      direct.status,
      direct.body,
    );
  }
  return null;
}

async function fetchAuthorizedPayment(
  authorizedPaymentId: string,
): Promise<Record<string, unknown> | null> {
  const result = await fetchMercadoPagoJson(
    `/authorized_payments/${authorizedPaymentId}`,
  );
  if (result.ok) {
    return result.data;
  }
  if (result.status !== 404) {
    console.error(
      "Failed to fetch MercadoPago authorized payment",
      result.status,
      result.body,
    );
  }
  return null;
}

async function fetchLegacyPayment(
  paymentId: string,
): Promise<Record<string, unknown> | null> {
  const result = await fetchMercadoPagoJson(`/v1/payments/${paymentId}`);
  if (result.ok) {
    return result.data;
  }
  if (result.status !== 404) {
    console.error(
      "Failed to fetch MercadoPago payment",
      result.status,
      result.body,
    );
  }
  return null;
}

async function syncProfileTier(targetUserId: string) {
  const { error } = await supabase.rpc("sync_profile_tier_from_billing", {
    target_user_id: targetUserId,
  });

  if (error) {
    console.error("Failed to sync profile tier from billing:", error);
    throw new Error("Failed to sync profile tier");
  }
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
  credits: number;
  recurring: boolean;
  productLabel?: string;
}) {
  if (!params.userEmail) return;

  const tierLabel =
    params.productLabel ??
    params.tier.charAt(0).toUpperCase() + params.tier.slice(1);
  const subject = params.recurring
    ? `Vector Subscription Payment Received - ${tierLabel}`
    : `Vector Purchase Confirmation - ${tierLabel}`;
  const message = params.recurring
    ? `<h1>Payment received</h1><p>Your <strong>${params.tier}</strong> subscription renewal was processed successfully.</p><p>Your included plan credits have been reset to <strong>${params.credits}</strong> for the current billing cycle.</p><p>Go to <a href="https://vectorplan.xyz/dashboard">Vector Dashboard</a> to continue building.</p>`
    : `<h1>Thank you for your purchase!</h1><p>You have successfully purchased <strong>${tierLabel}</strong>.</p><p><strong>${params.credits}</strong> credits have been added to your account.</p><p>Go to <a href="https://vectorplan.xyz/dashboard">Vector Dashboard</a> to start building.</p>`;

  fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: params.userEmail,
      subject,
      html: message,
    }),
  }).catch((error) => console.error("Failed to send billing email:", error));
}

async function syncMercadoPagoSubscription(params: {
  userId: string;
  subscription: Record<string, unknown>;
}): Promise<PaidTierId> {
  const subscriptionId = asString(params.subscription.id);
  if (!subscriptionId) {
    throw new Error("MercadoPago subscription payload is missing id");
  }

  const planId = pickString(
    params.subscription.preapproval_plan_id,
    params.subscription.preapproval_plan?.id,
  );
  const reason = pickString(
    params.subscription.reason,
    params.subscription.description,
    params.subscription.summarized,
  );
  const amount = asNumber(
    params.subscription.auto_recurring &&
      typeof params.subscription.auto_recurring === "object"
      ? (params.subscription.auto_recurring as Record<string, unknown>)
          .transaction_amount
      : null,
  );
  const tier =
    (await getExistingSubscriptionTier(subscriptionId)) ??
    inferTierFromPlanId(planId) ??
    inferTierFromText(reason, planId) ??
    inferTierFromAmount(amount);

  const rawStatus =
    pickString(params.subscription.status, params.subscription.status_detail) ??
    "pending";
  const normalizedStatus = normalizeMercadoPagoSubscriptionStatus(rawStatus);
  const autoRecurring =
    typeof params.subscription.auto_recurring === "object" &&
    params.subscription.auto_recurring !== null
      ? (params.subscription.auto_recurring as Record<string, unknown>)
      : null;

  const { error } = await supabase.from("billing_subscriptions").upsert(
    {
      user_id: params.userId,
      provider: "mercadopago",
      provider_subscription_id: subscriptionId,
      provider_customer_id: pickString(
        params.subscription.payer_id,
        params.subscription.collector_id,
      ),
      tier,
      status: normalizedStatus,
      status_formatted: titleCase(normalizedStatus),
      billing_interval:
        pickString(autoRecurring?.frequency_type, "month") ?? "month",
      product_name: reason ?? `Vector ${tier}`,
      variant_name: reason,
      user_email: pickString(params.subscription.payer_email),
      order_id: pickString(params.subscription.order_id),
      variant_id: planId,
      renews_at: asIsoString(params.subscription.next_payment_date),
      ends_at:
        asIsoString(params.subscription.date_of_end) ??
        (normalizedStatus === "cancelled"
          ? asIsoString(params.subscription.next_payment_date)
          : null),
      trial_ends_at: asIsoString(params.subscription.first_invoice_offset_date),
      paused: normalizedStatus === "paused",
      cancel_requested: normalizedStatus === "cancelled",
      metadata: params.subscription,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,provider_subscription_id" },
  );

  if (error) {
    console.error("Failed to upsert MercadoPago billing subscription:", error);
    throw new Error("Failed to sync MercadoPago subscription state");
  }

  await syncProfileTier(params.userId);

  return tier;
}

async function hasRecordedSubscriptionInvoice(
  subscriptionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("payments")
    .select("id")
    .eq("provider", "mercadopago")
    .eq("provider_subscription_id", subscriptionId)
    .eq("payment_type", "subscription_invoice")
    .limit(1)
    .maybeSingle();

  return Boolean(data?.id);
}

async function provisionAuthorizedSubscriptionIfNeeded(params: {
  userId: string;
  subscription: Record<string, unknown>;
  tier: PaidTierId;
}): Promise<void> {
  const subscriptionId = asString(params.subscription.id);
  if (!subscriptionId) {
    return;
  }

  const normalizedStatus = normalizeMercadoPagoSubscriptionStatus(
    pickString(params.subscription.status, params.subscription.status_detail),
  );
  if (normalizedStatus !== "active") {
    return;
  }

  if (await hasRecordedSubscriptionInvoice(subscriptionId)) {
    return;
  }

  const cycleEndsAt =
    asIsoString(params.subscription.next_payment_date) ??
    asIsoString(params.subscription.date_of_end) ??
    asIsoString(params.subscription.date_created);

  const { error } = await supabase.rpc("apply_subscription_credits", {
    target_user_id: params.userId,
    amount_to_add: creditsForTier(params.tier),
    cycle_ends_at: cycleEndsAt,
  });

  if (error) {
    console.error(
      "Failed to provision MercadoPago subscription credits after authorization:",
      error,
    );
    throw new Error("Failed to provision subscription credits");
  }
}

async function handleLegacyPaymentNotification(
  paymentId: string,
): Promise<Response> {
  const paymentData = await fetchLegacyPayment(paymentId);
  if (!paymentData) {
    return okResponse();
  }

  if ((asString(paymentData.status) ?? "") !== "approved") {
    return okResponse();
  }

  const paymentIdStr = String(paymentId);
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("provider", "mercadopago")
    .eq("provider_payment_id", paymentIdStr)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return okResponse();
  }

  const targetUserId = asString(paymentData.external_reference);
  const payerEmail = pickString(
    typeof paymentData.payer === "object" && paymentData.payer !== null
      ? (paymentData.payer as Record<string, unknown>).email
      : null,
  );

  if (!targetUserId) {
    console.warn(
      "MercadoPago one-time payment missing external_reference; skipping automatic credit sync.",
    );
    return okResponse();
  }

  const amount = asNumber(paymentData.transaction_amount);
  if (amount == null || amount < 1) {
    return okResponse();
  }

  const purchase = inferLegacyCreditPack(paymentData, amount);

  const { data: creditsAfter, error: rpcError } = await supabase.rpc(
    purchase.purchaseType === "extra_credits"
      ? "increment_extra_credits"
      : "increment_credits",
    {
      target_user_id: targetUserId,
      amount_to_add: purchase.creditsToAdd,
    },
  );
  if (rpcError || creditsAfter == null) {
    console.error(
      "Failed to increment credits:",
      rpcError,
      "creditsAfter:",
      creditsAfter,
    );
    return jsonResponse({ error: "Failed to update credits" }, 500);
  }

  if (purchase.purchaseType === "legacy_tier") {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ tier: purchase.tierHint })
      .eq("user_id", targetUserId);
    if (profileError) {
      console.error("Failed to update profile tier:", profileError);
      return jsonResponse({ error: "Failed to update plan" }, 500);
    }
  }

  const { error: payError } = await supabase.from("payments").insert({
    user_id: targetUserId,
    amount,
    currency: asString(paymentData.currency_id) ?? "USD",
    status: "approved",
    provider: "mercadopago",
    provider_payment_id: paymentIdStr,
    tier: purchase.tierHint,
    payment_type: "one_time",
    metadata: paymentData,
  });
  if (payError) {
    console.error("Failed to insert payment:", payError);
    return jsonResponse({ error: "Failed to record payment" }, 500);
  }

  await trackReferredPayment({
    userId: targetUserId,
    amount,
    currency: asString(paymentData.currency_id) ?? "USD",
    tier: purchase.tierHint,
    paymentId: paymentIdStr,
  });
  await sendBillingEmail({
    userEmail: payerEmail,
    tier: purchase.tierHint,
    credits: purchase.creditsToAdd,
    recurring: false,
    productLabel: purchase.productLabel,
  });

  return okResponse();
}

async function handleSubscriptionPreapprovalNotification(
  subscriptionId: string,
): Promise<Response> {
  const subscription = await fetchSubscriptionPreapproval(subscriptionId);
  if (!subscription) {
    return okResponse();
  }

  const targetUserId = await resolveTargetUserId({
    explicitUserId: subscription.external_reference,
    subscriptionId,
    userEmail: pickString(subscription.payer_email),
  });

  if (!targetUserId) {
    console.warn("Unable to map MercadoPago subscription to a Vector user", {
      subscriptionId,
      payerEmail: pickString(subscription.payer_email),
    });
    return okResponse();
  }

  const tier = await syncMercadoPagoSubscription({
    userId: targetUserId,
    subscription,
  });
  await provisionAuthorizedSubscriptionIfNeeded({
    userId: targetUserId,
    subscription,
    tier,
  });
  return okResponse();
}

async function handleSubscriptionAuthorizedPaymentNotification(
  authorizedPaymentId: string,
  action: string | null,
): Promise<Response> {
  const authorizedPayment = await fetchAuthorizedPayment(authorizedPaymentId);
  if (!authorizedPayment) {
    return okResponse();
  }

  const normalizedStatus = (
    pickString(authorizedPayment.status, authorizedPayment.status_detail) ?? ""
  ).toLowerCase();
  if (!SUCCESSFUL_AUTHORIZED_PAYMENT_STATUSES.has(normalizedStatus)) {
    return okResponse();
  }

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("provider", "mercadopago")
    .eq("provider_payment_id", authorizedPaymentId)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return okResponse();
  }

  const subscriptionId = pickString(
    authorizedPayment.preapproval_id,
    authorizedPayment.subscription_id,
  );
  const subscription = subscriptionId
    ? await fetchSubscriptionPreapproval(subscriptionId)
    : null;
  const targetUserId = await resolveTargetUserId({
    explicitUserId: pickString(
      authorizedPayment.external_reference,
      subscription?.external_reference,
    ),
    subscriptionId,
    userEmail: pickString(
      authorizedPayment.payer_email,
      subscription?.payer_email,
    ),
  });

  if (!targetUserId) {
    console.warn(
      "Unable to map MercadoPago recurring invoice to a Vector user",
      {
        authorizedPaymentId,
        subscriptionId,
        payerEmail: pickString(
          authorizedPayment.payer_email,
          subscription?.payer_email,
        ),
      },
    );
    return okResponse();
  }

  let tier: PaidTierId | null =
    await getExistingSubscriptionTier(subscriptionId);
  if (subscription) {
    tier = await syncMercadoPagoSubscription({
      userId: targetUserId,
      subscription,
    });
  }

  const amount =
    asNumber(authorizedPayment.transaction_amount) ??
    asNumber(authorizedPayment.amount) ??
    0;
  tier ??=
    inferTierFromText(
      authorizedPayment.reason,
      subscription?.reason,
      subscription?.preapproval_plan_id,
    ) ?? inferTierFromAmount(amount);

  const creditsToAdd = creditsForTier(tier);
  const cycleEndsAt =
    asIsoString(subscription?.next_payment_date) ??
    asIsoString(authorizedPayment.date_of_next_retry) ??
    asIsoString(authorizedPayment.date_created);

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
      "Failed to apply MercadoPago subscription credits:",
      creditsError,
      "creditsAfter:",
      creditsAfter,
    );
    return jsonResponse({ error: "Failed to update credits" }, 500);
  }

  const currency = asString(authorizedPayment.currency_id) ?? "ARS";
  const { error: paymentInsertError } = await supabase.from("payments").insert({
    user_id: targetUserId,
    amount,
    currency,
    status: normalizedStatus,
    provider: "mercadopago",
    provider_payment_id: authorizedPaymentId,
    tier,
    payment_type: "subscription_invoice",
    billing_interval: "month",
    billing_reason: action ?? "subscription_authorized_payment",
    provider_subscription_id: subscriptionId,
    provider_customer_id: pickString(
      authorizedPayment.payer_id,
      subscription?.payer_id,
    ),
    metadata: authorizedPayment,
  });

  if (paymentInsertError) {
    console.error(
      "Failed to record MercadoPago recurring payment:",
      paymentInsertError,
    );
    return jsonResponse({ error: "Failed to record recurring payment" }, 500);
  }

  await trackReferredPayment({
    userId: targetUserId,
    amount,
    currency,
    tier,
    paymentId: authorizedPaymentId,
  });
  await sendBillingEmail({
    userEmail: pickString(
      authorizedPayment.payer_email,
      subscription?.payer_email,
    ),
    tier,
    credits: creditsToAdd,
    recurring: true,
  });

  return okResponse();
}

async function handleWebhook(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.error("MERCADOPAGO_ACCESS_TOKEN not set");
    return jsonResponse({ error: "Server config error" }, 500);
  }

  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody) as WebhookBody;

    if (!(await verifySignature(req, body))) {
      return jsonResponse({ error: "Invalid signature" }, 401);
    }

    const url = new URL(req.url);
    const topic = pickString(
      body.type,
      body.topic,
      url.searchParams.get("topic"),
      url.searchParams.get("type"),
    );
    const resourceId = pickString(
      body.data?.id,
      url.searchParams.get("data.id"),
      url.searchParams.get("id"),
    );
    const action = asString(body.action);

    console.log("MercadoPago webhook received", { topic, action, resourceId });

    if (!topic || !resourceId) {
      return okResponse();
    }

    if (topic === "payment") {
      return await handleLegacyPaymentNotification(resourceId);
    }

    if (topic === "subscription_preapproval") {
      return await handleSubscriptionPreapprovalNotification(resourceId);
    }

    if (topic === "subscription_authorized_payment") {
      return await handleSubscriptionAuthorizedPaymentNotification(
        resourceId,
        action,
      );
    }

    return okResponse();
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
}

Deno.serve(handleWebhook);
