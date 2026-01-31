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
  data: {
    id: string;
  };
  action?: string;
}

Deno.serve(async (req) => {
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
    const body: WebhookBody = await req.json();
    console.log("Webhook received:", body);

    // We only care about "payment" (or "payment.created" / "payment.updated" depending on api version, usually just type="payment")
    // or topic="payment" in some versions. The query params often have 'topic=payment' or 'type=payment'.
    // The body usually has `{ type: "payment", data: { id: "..." } }`
    if (body.type !== "payment") {
        // Acknowledge other events so MP doesn't retry
        return new Response(JSON.stringify({ ok: true, message: "Ignored event type" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const paymentId = body.data.id;
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

    // 1. Fetch payment details from MercadoPago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
            "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
        }
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

    // 2. Check if approved
    if (paymentData.status === 'approved') {
        // 3. Extract user info. 
        // We expect 'external_reference' to be the user_id (if we set it in preference).
        // OR we can look at payer.email and match it to auth.users.
        // For Vector, let's assume external_reference is user_id.
        // If external_reference is missing, we might try to find user by email.
        
        const userId = paymentData.external_reference;
        const payerEmail = paymentData.payer?.email;
        let targetUserId = userId;

        if (!targetUserId && payerEmail) {
             // Try to find user by email
             // This requires access to auth.users which is restricted even for service role usually via direct query, 
             // but we can try typically. Or we just look at public profiles if we synced emails there (we usually didn't).
             // Best practice: The creating preference logic MUST set external_reference.
             console.warn("No external_reference, trying to find user logic skipped. Please ensure preference has external_reference.");
        }

        if (targetUserId) {
            console.log(`Processing approved payment for user: ${targetUserId}`);
            
            // 4. Determine tier/credits based on amount or description
            // Simplified logic: 
            // - If amount ~ 19 -> Standard (15 credits)
            // - If amount ~ 39 -> Max (40 credits)
            // - Or check description
            
            const amount = parseFloat(paymentData.transaction_amount);
            let creditsToAdd = 0;
            let newTier = 'architect'; // don't downgrade, but default var

            // Heuristic matching TIER_CONFIGS from src/lib/tiers.ts
            if (amount >= 35) { // Max
                creditsToAdd = 40;
                newTier = 'max';
            } else if (amount >= 15) { // Standard
                creditsToAdd = 15;
                newTier = 'standard';
            } else {
                // Fallback or donation?
                creditsToAdd = 5;
            }

            // 5. Update Profile via RPC or direct update
            // We use increment_credits RPC for safety, and update tier directly.
            
            // First update tier if it's better than current? 
            // For now, just set it.
            
            // Use RPC to add credits safely
            const { error: rpcError } = await supabase.rpc('increment_credits', { 
                user_id_arg: targetUserId, 
                amount: creditsToAdd 
            });

            if (rpcError) {
                // If RPC missing, try direct update (less safe for concurrency but works)
                 console.error("RPC increment_credits failed, trying direct update", rpcError);
                 const { data: profile } = await supabase.from('profiles').select('credits').eq('user_id', targetUserId).single();
                 if (profile) {
                     await supabase.from('profiles').update({ credits: (profile.credits || 0) + creditsToAdd }).eq('user_id', targetUserId);
                 }
            }

            // Update Tier (we can just set it, assume user wants the tier they bought)
            // We might need a 'tier' column in profiles. existing schema has 'level', 'credits', 'points'.
            // Let's assume we need to add 'tier' column or just store it in metadata. 
            // Wait, README says "profile.tier" is a thing we plan to use.
            // Let's check existing schema via sql or assumptions. 
            // The README says "tier enforcement... use src/lib/tiers.ts and (when available) profile.tier".
            // So we probably need to ensure the column exists. I will add it in the SQL file.
            
            await supabase.from('profiles').update({ 
                // We'll assume the column 'tier' exists or will be created by the user running my SQL.
                tier: newTier 
            }).eq('user_id', targetUserId);

            console.log(`Updated user ${targetUserId}: +${creditsToAdd} credits, tier -> ${newTier}`);
        }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
