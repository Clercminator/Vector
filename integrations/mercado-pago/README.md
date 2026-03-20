# MercadoPago (active — LATAM)

- **Client:** `src/lib/mercadoPago.ts` — `createCheckout()`, `isMercadoPagoConfigured()`
- **Backend:** `supabase/functions/mercado-pago-preference`, `supabase/functions/mercado-pago-webhook`
- **Script:** `scripts/verify_webhook.js` — webhook endpoint test

Secrets: `MERCADOPAGO_ACCESS_TOKEN` (Supabase). Frontend: `VITE_MERCADOPAGO_PUBLIC_KEY` (optional for Bricks).

## Webhook setup (required for credits to be granted)

Credits are granted when the webhook receives payment notifications from MercadoPago. **You must configure the webhook in your MercadoPago dashboard:**

1. Go to [MercadoPago Developers](https://www.mercadopago.com/developers) → Your application → Webhooks
2. Add a webhook URL: `https://<your-supabase-project>.supabase.co/functions/v1/mercado-pago-webhook`
3. Subscribe to **Payments** events
4. Ensure `MERCADOPAGO_ACCESS_TOKEN` is set in Supabase Edge Function secrets

Without this, payments succeed but users do **not** receive credits automatically.

## Manual credit grant (when webhook fails)

If a user paid but did not receive credits (e.g. webhook not configured, transient failure), run the SQL in `scripts/extend-profile-credits.sql` in the Supabase SQL Editor. Use **Option B** to add 5 plans (Builder) or 20 plans (Max):

```sql
-- Replace with the customer's email (e.g. gsosa2703@gmail.com)
UPDATE profiles
SET extra_credits = COALESCE(extra_credits, 0) + 5
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'CUSTOMER_EMAIL' LIMIT 1);
```

Then update their tier: `UPDATE profiles SET tier = 'standard' WHERE user_id = ...;`
