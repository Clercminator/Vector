// Supabase Edge Function: MercadoPago Webhook
// Handles payment notifications from MercadoPago.
// Updates user credits and tier upon successful payment.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface WebhookBody {
  type: string;
  data: { id: string };
  action?: string;
}

function okResponse() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleWebhook(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as WebhookBody;
    console.log("Webhook received:", body);

    if (body.type !== "payment") {
      return okResponse();
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "No payment ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not set");
      return new Response(JSON.stringify({ error: "Server config error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
    });

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error("Failed to fetch payment", mpRes.status, errText);
      // 404 = payment not found (simulation uses fake ID, or stale notification). Return 200 so MP stops retrying.
      if (mpRes.status === 404) {
        return okResponse();
      }
      return new Response(JSON.stringify({ error: "Failed to verify payment" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentData = await mpRes.json();
    console.log("Payment status:", paymentData.status);

    if (paymentData.status !== "approved") {
      return okResponse();
    }

    const paymentIdStr = String(paymentId);

    // Idempotency: skip if we already processed this payment (MercadoPago can resend webhooks)
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("provider", "mercadopago")
      .eq("provider_payment_id", paymentIdStr)
      .limit(1)
      .maybeSingle();
    if (existing) {
      console.log(`Payment ${paymentIdStr} already processed, skipping.`);
      return okResponse();
    }

    const targetUserId = paymentData.external_reference;
    const payerEmail = paymentData.payer?.email;

    if (!targetUserId) {
      console.warn("No external_reference. Ensure preference has external_reference.");
      return okResponse();
    }

    console.log(`Processing approved payment for user: ${targetUserId}`);

    const amount = parseFloat(paymentData.transaction_amount);
    if (isNaN(amount) || amount < 1) {
      console.warn("Invalid or zero amount, skipping:", amount);
      return okResponse();
    }

    // Align with TIER_CONFIGS: builder 5 credits / ~$6, max 20 credits / ~$13
    let creditsToAdd: number;
    let newTier: string;
    if (amount >= 10) {
      creditsToAdd = 20;
      newTier = "max";
    } else {
      creditsToAdd = 5;
      newTier = "builder";
    }

    const { data: creditsAfter, error: rpcError } = await supabase.rpc("increment_credits", {
      target_user_id: targetUserId,
      amount_to_add: creditsToAdd,
    });
    if (rpcError || creditsAfter == null) {
      console.error("Failed to increment credits:", rpcError, "creditsAfter:", creditsAfter);
      return new Response(JSON.stringify({ error: "Failed to update credits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ tier: newTier })
      .eq("user_id", targetUserId);
    if (profileError) {
      console.error("Failed to update profile tier:", profileError);
      return new Response(JSON.stringify({ error: "Failed to update plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: payError } = await supabase.from("payments").insert({
      user_id: targetUserId,
      amount: amount,
      currency: paymentData.currency_id || "USD",
      status: "approved",
      provider: "mercadopago",
      provider_payment_id: paymentIdStr,
      metadata: paymentData,
    });
    if (payError) {
      console.error("Failed to insert payment:", payError);
      return new Response(JSON.stringify({ error: "Failed to record payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for Referrer
    const { data: profile } = await supabase.from("profiles").select("referrer_code").eq("user_id", targetUserId).single();
    if (profile?.referrer_code) {
        // Fire analytics event for commission tracking
        await supabase.from("analytics_events").insert({
            user_id: targetUserId,
            event_type: 'payment_referred',
            data: {
                referrer_code: profile.referrer_code,
                amount: amount,
                currency: paymentData.currency_id || "USD",
                tier: newTier,
                payment_id: paymentIdStr
            }
        });
        console.log(`Attributed payment to referrer: ${profile.referrer_code}`);
    }

    if (payerEmail) {
      const tierLabel = newTier.charAt(0).toUpperCase() + newTier.slice(1);
      const emailBody = JSON.stringify({
        to: payerEmail,
        subject: `Vector Purchase Confirmation - ${tierLabel} Tier`,
        html: `<h1>Thank you for your purchase!</h1><p>You have successfully purchased the <strong>${newTier}</strong> tier.</p><p><strong>${creditsToAdd} credits</strong> have been added to your account.</p><p>Go to <a href="https://vector.app/dashboard">Vector Dashboard</a> to start building.</p>`,
      });

      fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: emailBody,
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
}

Deno.serve(handleWebhook);
