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
      console.error("Failed to fetch payment", await mpRes.text());
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

    const targetUserId = paymentData.external_reference;
    const payerEmail = paymentData.payer?.email;

    if (!targetUserId) {
      console.warn("No external_reference. Ensure preference has external_reference.");
      return okResponse();
    }

    console.log(`Processing approved payment for user: ${targetUserId}`);

    const amount = parseFloat(paymentData.transaction_amount);
    let creditsToAdd = 5;
    let newTier = "architect";

    if (amount >= 35) {
      creditsToAdd = 40;
      newTier = "max";
    } else if (amount >= 15) {
      creditsToAdd = 15;
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
      amount: amount,
      currency: paymentData.currency_id || "USD",
      status: "approved",
      provider: "mercadopago",
      provider_payment_id: String(paymentId),
      metadata: paymentData,
    });

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
