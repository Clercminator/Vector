# Lemon Squeezy (active — global)

- **Client:** `src/lib/lemonSqueezy.ts` — `createLemonSqueezyCheckout()`, `isLemonSqueezyConfigured()`
- **Backend:** `supabase/functions/lemonsqueezy-checkout`, `supabase/functions/lemonsqueezy-webhook`

Secrets (Supabase Dashboard → Project Settings → Edge Functions → Secrets):  
`LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_STANDARD`, `LEMONSQUEEZY_VARIANT_MAX`, `LEMONSQUEEZY_WEBHOOK_SECRET`.

---

## Setup (after identity verification)

### 1. Get API key and Store ID

- Lemon Squeezy Dashboard → **Settings** → **API** (or **Developers**): create an API key, copy it.
- **Store ID**: Settings → **General** or store switcher; or from the store URL (e.g. `https://app.lemonsqueezy.com/settings/store` shows store ID). Add to Supabase Secrets as `LEMONSQUEEZY_STORE_ID`.

### 2. Create the two products

- **Products** → **+ New Product**.

**Product 1 – Builder (Standard)**

- Name: e.g. **Vector Builder** (or Constructor).
- One-time payment, **$5.99**.
- Publish, then open the product → copy the **Variant ID** (from variant row or API). Set in Supabase as `LEMONSQUEEZY_VARIANT_STANDARD`.

**Product 2 – Max**

- Name: e.g. **Vector Max**.
- One-time payment, **$12.99**.
- Publish, then copy the **Variant ID**. Set in Supabase as `LEMONSQUEEZY_VARIANT_MAX`.

(Optional) In each product’s **Confirmation modal** / **Email receipt**, set **Button link** to your app (e.g. `https://vectorplan.xyz/dashboard` or `/dashboard?payment=success`).

### 3. Create the webhook

- **Settings** → **Webhooks** → click the **+** (Add webhook).
- **Callback URL:**  
  `https://rfemwgtomtzbwhfgpcuo.supabase.co/functions/v1/lemonsqueezy-webhook`  
  (replace with your Supabase project URL if different).
- **Signing secret:** Generate a random string (e.g. 6–40 chars), enter it here, and set the **exact same value** in Supabase Secrets as `LEMONSQUEEZY_WEBHOOK_SECRET`.
- **Events:** Enable at least **order_created**. (Others are optional; the handler only processes `order_created`.)
- Save the webhook.

### 4. Set Supabase secrets

In Supabase → **Project Settings** → **Edge Functions** → **Secrets**, add:

| Secret                          | Value                                     |
| ------------------------------- | ----------------------------------------- |
| `LEMONSQUEEZY_API_KEY`          | Your Lemon Squeezy API key                |
| `LEMONSQUEEZY_STORE_ID`         | Your store ID (numeric)                   |
| `LEMONSQUEEZY_VARIANT_STANDARD` | Variant ID of the $5.99 Builder product   |
| `LEMONSQUEEZY_VARIANT_MAX`      | Variant ID of the $12.99 Max product      |
| `LEMONSQUEEZY_WEBHOOK_SECRET`   | Same string as the webhook Signing secret |

Redeploy or wait for the next cold start so the functions pick up the new secrets.

### 5. Flow check

- **Get Builder** / **Get Max** (US/EU) → `lemonsqueezy-checkout` creates a checkout with `user_id` in custom data → user is sent to Lemon Squeezy payment.
- After payment, Lemon Squeezy sends **order_created** to `lemonsqueezy-webhook` → handler verifies signature, updates `profiles.tier` and credits, inserts into `payments`, optionally sends email.
- User can be redirected to `?payment=success` via the checkout’s `redirect_url` (set in the edge function).

---

## Webhook 401 errors

The `lemonsqueezy-webhook` Edge Function is configured with `verify_jwt = false` in `supabase/config.toml` so it accepts unauthenticated POST requests from Lemon Squeezy. If webhooks return 401, ensure you have deployed with `supabase functions deploy lemonsqueezy-webhook` after the config change.

## Profiles + credits

The `increment_credits` RPC (called by this webhook) ensures a `public.profiles` row exists for the paying user before adding credits—same as MercadoPago. Apply migration `20260320120000_ensure_profile_payment_safety.sql` on your Supabase project so this logic is live.
