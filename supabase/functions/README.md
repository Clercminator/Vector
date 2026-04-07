# Edge Functions — Deploy Guide

This folder contains the Supabase Edge Functions used by Vector. Deploy them via the Supabase Dashboard or CLI.

---

## List of Functions

| Function                      | Purpose                                                                             | Secrets / Dependencies                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `handle-new-user`             | Triggered on signup; sends welcome email                                            | `RESEND_API_KEY`                                                                                             |
| `mercado-pago-preference`     | Creates MercadoPago checkout; returns `init_point`                                  | `MERCADOPAGO_ACCESS_TOKEN`                                                                                   |
| `mercado-pago-webhook`        | Handles payment notifications; updates credits/tier                                 | `MERCADOPAGO_ACCESS_TOKEN`                                                                                   |
| `billing-cancel-subscription` | Cancels the active Lemon Squeezy or MercadoPago subscription for the signed-in user | `LEMONSQUEEZY_API_KEY`, `MERCADOPAGO_ACCESS_TOKEN`                                                           |
| `openrouter-proxy`            | Proxies AI requests to Open Router                                                  | `OPENROUTER_API_KEY` or `OPENROUTER_API_KEY_2`                                                               |
| `send-email`                  | Sends transactional emails                                                          | `RESEND_API_KEY`                                                                                             |
| `lemonsqueezy-checkout`       | Creates Lemon Squeezy checkout for US/EU users                                      | `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_STANDARD`, `LEMONSQUEEZY_VARIANT_MAX` |
| `lemonsqueezy-webhook`        | Handles Lemon Squeezy payment notifications; updates credits/tier                   | `LEMONSQUEEZY_WEBHOOK_SECRET`                                                                                |
| **`get-shared-blueprint`**    | **Returns shared plan data by token** (for `/share/:token`)                         | None (uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, auto-injected)                                    |

---

## Deploy via Supabase CLI

From the project root:

```bash
# Deploy a single function
supabase functions deploy get-shared-blueprint

# Deploy all functions
supabase functions deploy
```

Ensure you’re linked to your project: `supabase link`.

---

## Deploy via Supabase Dashboard

1. In the left sidebar, go to **Edge Functions**.
2. Click **Deploy a new function**.
3. Name it `get-shared-blueprint`.
4. Copy the contents of `supabase/functions/get-shared-blueprint/index.ts` into the editor.
5. Click **Deploy function**.

---

## New Function: `get-shared-blueprint`

**Purpose:** Used when someone opens a share link (`/share/:token`). Returns read-only blueprint, tracker, logs, sub-goals, tasks, and task completions so the shared view can render.

**Prerequisites:** Run the batch 3 migration so the `blueprint_shares` table exists.

**API:**

- **GET** `https://<project>.supabase.co/functions/v1/get-shared-blueprint?token=<uuid>`
- **POST** `https://<project>.supabase.co/functions/v1/get-shared-blueprint` with body `{ "token": "<uuid>" }`

**Response (200):**

```json
{
  "blueprint": { ... },
  "tracker": { ... },
  "logs": [ ... ],
  "subGoals": [ ... ],
  "tasks": [ ... ],
  "taskCompletions": [ ... ]
}
```

**Response (404):** `{ "error": "Link expired or invalid" }`
