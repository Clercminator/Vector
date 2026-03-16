# MercadoPago (active — LATAM)

- **Client:** `src/lib/mercadoPago.ts` — `createCheckout()`, `isMercadoPagoConfigured()`
- **Backend:** `supabase/functions/mercado-pago-preference`, `supabase/functions/mercado-pago-webhook`
- **Script:** `scripts/verify_webhook.js` — webhook endpoint test

Secrets: `MERCADOPAGO_ACCESS_TOKEN` (Supabase). Frontend: `VITE_MERCADOPAGO_PUBLIC_KEY` (optional for Bricks).
