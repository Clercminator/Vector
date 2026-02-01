# Stripe integration (pending — future implementation)

Stripe is **not** integrated in Vector today. This folder documents the intended Stripe flow for **future implementation** when you have a registered business in the US.

**Current payments:** Vector uses **MercadoPago** (Latam, including Argentina). See the main [README](../../../README.md) (sections "Backend", "Payment Flow (MercadoPago)", "Edge Functions") for the active payment flow.

---

## Why Stripe is pending

- Stripe typically requires a registered business in the US (or supported countries).
- MercadoPago is used instead for Latam (Argentina, Brazil, etc.).

---

## Intended Stripe flow (for later)

1. User clicks “Go Pro” or “Subscribe” on the Pricing page.
2. **Frontend** calls **your backend** (e.g. “create checkout session”).
3. **Backend** (Supabase Edge Function or Vercel Function) uses the **Stripe server SDK** and your **secret key** (`sk_test_...` / `sk_live_...`) to create a **Checkout Session** (or Payment Intent for custom UI). It returns the **URL** (or client secret) to the frontend.
4. User is redirected to Stripe Checkout (or pays in your page with Stripe.js using the client secret).
5. After payment, Stripe sends a **webhook** to **your backend**. The backend verifies the webhook, then updates Supabase (e.g. `profiles.credits` or a `subscriptions` table).

**Security:** The Stripe **secret key** must **never** be in the frontend. It must live only in backend env (e.g. Supabase Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).

---

## Where to implement (when ready)

- One Supabase Edge Function (e.g. `create-checkout`) that reads Stripe secret from Secrets and returns the session URL.
- Another function (e.g. `stripe-webhook`) that Stripe calls to update credits/levels in Supabase.
- From the Pricing page, call the “create checkout” function and redirect the user to the returned URL.

---

## Useful links

- [Stripe API Reference](https://docs.stripe.com/api)
- [Stripe Authentication](https://docs.stripe.com/api/authentication)
- [Stripe Developer resources](https://stripe.com/docs/development)
- [Stripe samples](https://github.com/stripe-samples) — e.g. `checkout-one-time-payments`, `checkout-single-subscription`
