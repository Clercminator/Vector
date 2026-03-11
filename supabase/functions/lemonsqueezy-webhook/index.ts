// Supabase Edge Function: Lemon Squeezy Webhook
// Handles order_created events from Lemon Squeezy.
// Updates user credits and tier upon successful payment.
// Set LEMONSQUEEZY_WEBHOOK_SECRET in Supabase Secrets (same as signing secret in Lemon Squeezy dashboard).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET?.trim() || !signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
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

  if (eventName !== "order_created") {
    return okResponse();
  }

  try {
    const body = JSON.parse(rawBody);
    const attrs = body?.data?.attributes;
    const meta = body?.meta;
    const customData = meta?.custom_data || {};

    if (!attrs || attrs.status !== "paid") {
      return okResponse();
    }

    const userEmail = attrs.user_email;
    const userId = customData.user_id;
    const totalUsd = attrs.total_usd != null ? attrs.total_usd / 100 : 0;
    const firstItem = attrs.first_order_item;
    const variantId = firstItem?.variant_id;

    let targetUserId: string | null = userId || null;

    if (!targetUserId && userEmail) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const match = authUsers?.users?.find((u) => u.email?.toLowerCase() === userEmail.toLowerCase());
      targetUserId = match?.id ?? null;
    }

    if (!targetUserId) {
      console.warn("No user_id in custom_data and no matching user by email:", userEmail);
      return okResponse();
    }

    let creditsToAdd = 5;
    let newTier = "standard";

    if (totalUsd >= 10 || (variantId && String(variantId) === Deno.env.get("LEMONSQUEEZY_VARIANT_MAX"))) {
      creditsToAdd = 20;
      newTier = "max";
    } else if (totalUsd >= 5 || variantId) {
      creditsToAdd = 5;
      newTier = "standard";
    }

    const { error: rpcError } = await supabase.rpc("increment_credits", {
      user_id: targetUserId,
      amount: creditsToAdd,
    });
    if (rpcError) console.error("Failed to increment credits:", rpcError);

    await supabase.from("profiles").update({ tier: newTier }).eq("user_id", targetUserId);

    await supabase.from("payments").insert({
      user_id: targetUserId,
      amount: totalUsd,
      currency: attrs.currency || "USD",
      status: "approved",
      provider: "lemonsqueezy",
      provider_payment_id: String(body?.data?.id ?? attrs.identifier ?? ""),
      metadata: body,
    });

    const { data: profile } = await supabase.from("profiles").select("referrer_code").eq("user_id", targetUserId).single();
    if (profile?.referrer_code) {
      await supabase.from("analytics_events").insert({
        user_id: targetUserId,
        event_type: "payment_referred",
        data: {
          referrer_code: profile.referrer_code,
          amount: totalUsd,
          currency: attrs.currency || "USD",
          tier: newTier,
          payment_id: String(body?.data?.id ?? ""),
        },
      });
    }

    if (userEmail) {
      const tierLabel = newTier.charAt(0).toUpperCase() + newTier.slice(1);
      fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: userEmail,
          subject: `Vector Purchase Confirmation - ${tierLabel} Tier`,
          html: `<h1>Thank you for your purchase!</h1><p>You have successfully purchased the <strong>${newTier}</strong> tier.</p><p><strong>${creditsToAdd} credits</strong> have been added to your account.</p><p>Go to <a href="https://vectorplan.xyz/dashboard">Vector Dashboard</a> to start building.</p>`,
        }),
      }).catch((e) => console.error("Failed to send email:", e));
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
