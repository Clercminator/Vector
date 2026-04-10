# MercadoPago (active — LATAM)

- **Client:** `src/lib/mercadoPago.ts` and `src/app/components/MercadoPagoSubscriptionDialog.tsx`
- **Backend:** `supabase/functions/mercado-pago-preference`, `supabase/functions/mercado-pago-webhook`, `supabase/functions/billing-cancel-subscription`
- **Schema:** `supabase/migrations/20260407120000_billing_subscriptions.sql`
- **Script:** `scripts/verify_webhook.js` — webhook endpoint test

Vector now uses MercadoPago for two different LATAM billing flows:

- recurring Builder and Max subscriptions through a custom MercadoPago CardForm dialog
- one-time extra-credit packs through MercadoPago Checkout Pro

Frontend env:

- `VITE_MERCADOPAGO_PUBLIC_KEY`
- optional `VITE_MERCADOPAGO_PUBLIC_KEY_PRUEBA`
- optional `VITE_MERCADOPAGO_ENVIRONMENT`

Supabase secrets:

- `MERCADOPAGO_ACCESS_TOKEN`
- optional `MERCADOPAGO_ACCESS_TOKEN_PRUEBA`
- optional `MERCADOPAGO_USD_TO_ARS_RATE_OVERRIDE`

For the full implementation notes, rationale, test/live switching rules, and webhook lifecycle details, see [docs/mercadopago-billing.md](../../docs/mercadopago-billing.md).

## Webhook setup (required for credits to be granted)

Credits and subscription state are synced only when the webhook receives MercadoPago notifications. **You must configure the webhook in your MercadoPago dashboard:**

1. Go to [MercadoPago Developers](https://www.mercadopago.com/developers) → Your application → Webhooks
2. Add a webhook URL: `https://<your-supabase-project>.supabase.co/functions/v1/mercado-pago-webhook`
3. Subscribe to **Payments** events
4. Ensure `MERCADOPAGO_ACCESS_TOKEN` is set in Supabase Edge Function secrets
5. If you need true MercadoPago test-card validation on deployed URLs, also set `MERCADOPAGO_ACCESS_TOKEN_PRUEBA` and expose `VITE_MERCADOPAGO_PUBLIC_KEY_PRUEBA` in the frontend build

Without this, payments may succeed at MercadoPago but Vector will not reliably sync credits, tier state, or recurring subscription lifecycle data.

## Billing state storage

Recurring billing is stored in `public.billing_subscriptions`, not only in `payments`. The webhook upserts provider subscription state there and the profile UI reads that table to show provider, status, renew date, end date, and cancellation state.

## Profile row required for credits

`increment_credits` (used by the webhook) calls `ensure_profile_for_user` first: if `public.profiles` is missing for that `auth.users` id, it is created from Auth metadata before credits are added. Migration `20260320120000_ensure_profile_payment_safety.sql` also backfills existing Auth users without profiles. The app calls `ensure_my_profile` after sign-in so the UI never depends on a broken trigger alone.

For recurring plans, cycle credits are handled through `apply_subscription_credits()` and `sync_profile_tier_from_billing()` from `20260407120000_billing_subscriptions.sql`.

## Test mode override

The frontend supports a safe live/test override through the query parameter `?mp_env=test` or `?mp_env=live`. The selected mode is persisted in local storage.

Important: the visible test-mode badge only means the app selected test mode. Test cards will still fail if the deployed frontend does not actually contain `VITE_MERCADOPAGO_PUBLIC_KEY_PRUEBA`.

## Manual credit grant (when webhook fails)

If a user paid but did not receive credits (e.g. webhook not configured, transient failure), run the SQL in `scripts/extend-profile-credits.sql` in the Supabase SQL Editor. Use **Option B** to add 5 plans (Builder) or 20 plans (Max):

```sql
-- Replace with the customer's email (e.g. gsosa2703@gmail.com)
UPDATE profiles
SET extra_credits = COALESCE(extra_credits, 0) + 5
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'CUSTOMER_EMAIL' LIMIT 1);
```

Then update their tier: `UPDATE profiles SET tier = 'builder' WHERE user_id = ...;`
