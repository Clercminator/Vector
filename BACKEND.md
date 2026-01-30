# Backend integration guide — Stripe, Supabase, Vercel

You’re right: **everything we have so far is frontend.** To add **payment logic**, **credits/levels**, and **secure AI** we need a **backend** — code that runs on a server and never exposes secrets (API keys, Stripe secret key) to the browser.

This guide explains **what runs where**, **why** a backend is needed, and **how** to plug in Stripe, Supabase, and Vercel step by step.

---

## 1. Frontend vs backend (simple picture)

| Runs in | Where it runs | Who can see it | Good for |
|--------|----------------|----------------|----------|
| **Frontend** | User’s browser (your React/Vite app) | Anyone who opens DevTools or “View source” | UI, calling your own APIs, reading public data |
| **Backend** | A server (Vercel, Supabase, etc.) | Only you and your server | Secret keys, payment processing, updating credits/levels |

- Anything in your React app (including `import.meta.env.VITE_*`) is **frontend**. Users can see it. So:
  - **Stripe secret key** (`sk_test_...` / `sk_live_...`) must **never** be in the frontend. Stripe’s docs say: do not put secret keys in client-side code or public repos.
  - **Open Router API key** is the same: for production it should live only on the server.
- **Backend** = code that runs on a server. Only the server sees env vars (e.g. Stripe secret, Open Router key). The browser only talks to *your* backend; your backend then talks to Stripe / Open Router.

So: **payment logic, credits/levels logic, and AI with a secret key** → must run in **backend** code.

---

## 2. How Vector fits together (high level)

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (Frontend) — what you have now                         │
│  • React app (Vite)                                              │
│  • Calls Supabase for auth + DB (anon key is OK in frontend)     │
│  • Will call YOUR backend for: AI, checkout URL, webhooks        │
└─────────────────────────────────────────────────────────────────┘
         │                    │                      │
         ▼                    ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│  Supabase       │  │  Your backend   │  │  Stripe                  │
│  • Auth         │  │  (see below)    │  │  • Checkout / Payments   │
│  • DB (profiles,│  │  • AI proxy     │  │  • Webhooks → your       │
│    blueprints,   │  │  • Stripe       │  │    backend               │
│    waitlist…)   │  │    checkout     │  │                          │
│  • Edge         │  │  • Webhook      │  │  (secret key only on     │
│    Functions    │  │    handler      │  │   your backend)           │
└─────────────────┘  └─────────────────┘  └─────────────────────────┘
```

- **Supabase**: you already use it for auth and DB. It can also run **Edge Functions** (server-side code) and store **Secrets** (e.g. Open Router key, Stripe secret). Integrations with **Vercel** keep env vars in sync.
- **Vercel**: hosts your frontend and can run **serverless functions** (API routes). You can put backend logic there instead of (or in addition to) Supabase Edge Functions.
- **Stripe**: payments. Your **backend** creates Checkout Sessions or Payment Intents and returns a URL or client secret to the frontend; Stripe sends **webhooks** to your backend when a payment succeeds so you can update credits/levels in Supabase.

---

## 3. Where to put backend code: two options

You can use **one** of these (or both for different features):

| Option | Where | Best for |
|--------|--------|----------|
| **A) Supabase Edge Functions** | Supabase dashboard or CLI, runs on Supabase | AI proxy, small APIs, webhooks (Stripe → Supabase). Secrets in Supabase “Secrets”. |
| **B) Vercel Serverless Functions** | `/api` folder in your repo, runs on Vercel | Same ideas; keeps all code in one repo; env vars in Vercel project settings. |

For learning, **Supabase Edge Functions** are a good start: you already use Supabase, and the dashboard has an “Edge Functions” section with templates (e.g. “Supabase Database Access”). We’ll add one function that **proxies Open Router** so the AI key never goes to the browser.

---

## 4. Step-by-step plan

### Step 1: Deploy frontend to Vercel (you’re already close)

- Import your GitHub repo (`Clercminator/Vector`) in Vercel.
- **Framework Preset**: if Vite is detected, use it; otherwise set **Build Command** to `npm run build` and **Output Directory** to `dist`.
- In **Environment Variables**, add only **public** keys your frontend needs:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` (or `VITE_ANON_PUBLIC_KEY`)
- Do **not** put Stripe secret key or Open Router key here if the frontend will stop using them once the proxy is on.

### Step 2: AI logic — move Open Router to the backend

- **Problem**: `VITE_OPENROUTER_API_KEY` in the frontend is visible to users.
- **Solution**: a small backend that receives the same request the frontend would send to Open Router, adds the API key on the server, and forwards the request.
- We added a **Supabase Edge Function** `openrouter-proxy` for this (see below). You store `OPENROUTER_API_KEY` in Supabase **Secrets**, and the frontend calls your function URL instead of Open Router directly. No key in the browser.

### Step 3: Payment logic — Stripe

- **Stripe docs** (as in your screenshots): API is REST, auth with API keys; **secret keys must not be in client-side code**. Use **test** keys (`sk_test_...`) while learning.
- **Flow**:
  1. User clicks “Go Pro” or “Subscribe” on your Pricing page.
  2. **Frontend** calls **your backend** (e.g. “create checkout session”).
  3. **Backend** (Edge Function or Vercel Function) uses the **Stripe server SDK** and your **secret key** to create a **Checkout Session** (or Payment Intent for custom UI). It returns the **URL** (or client secret) to the frontend.
  4. User is redirected to Stripe Checkout (or pays in your page with Stripe.js using the client secret).
  5. After payment, Stripe sends a **webhook** to **your backend**. The backend verifies the webhook, then updates Supabase (e.g. set `profiles.credits` or a `subscriptions` table for levels).
- **Useful Stripe samples** (from your screenshot): **checkout-one-time-payments**, **checkout-single-subscription**. They show both frontend and backend; the backend part is what you need for Vector.
- **Where to implement**: one Supabase Edge Function (e.g. `create-checkout`) that reads Stripe secret from Secrets and returns the session URL; another function (e.g. `stripe-webhook`) that Stripe calls to update credits/levels in Supabase.

### Step 4: Credits and levels logic

- **Data** is already in Supabase: `profiles` has `credits`, `level`, `points`.
- **When to change them**:
  - **Credits**: when user “buys” credits (one-time Stripe payment) → webhook handler increments `profiles.credits`. When user uses AI → your backend or another Edge Function decrements (you already have or will add `decrement_credits` RPC).
  - **Levels**: you already update `level` when saving blueprints (e.g. points/100). You can also level up when a subscription is active (e.g. “Master Builder” tier = level 2+).
- So credits/levels **logic** is: “when payment succeeds (webhook) or when user uses AI (backend call), update Supabase.” All of that runs on the **backend**.

### Step 5: Connect Supabase and Vercel

- In **Supabase → Integrations**, install the **Vercel** integration. That keeps Supabase-related env vars in sync with your Vercel project, so the frontend can talk to Supabase from the deployed app.
- Use **Supabase Secrets** (dashboard → Edge Functions → Secrets) for `OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` so Edge Functions can use them without hardcoding.

---

## 5. What we added in this repo

- **`supabase/functions/openrouter-proxy/index.ts`** — A Supabase Edge Function that:
  - Reads `OPENROUTER_API_KEY` from Supabase Secrets.
  - Accepts a JSON body (same shape the frontend would send to Open Router: `model`, `messages`, `max_tokens`, `temperature`).
  - Forwards the request to Open Router and returns the response.
  - So the frontend can call this function’s URL instead of Open Router; the API key stays on the server.

- **Frontend** (`src/lib/openrouter.ts`) can use the proxy: set **`VITE_OPENROUTER_PROXY_URL`** to your deployed function URL. If that is set, the app calls the proxy and does **not** need `VITE_OPENROUTER_API_KEY` in the browser.

### Deploying the Open Router proxy (Supabase Edge Function)

1. **Install Supabase CLI** (if you haven’t): [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
2. **Log in and link your project**: `supabase login` then `supabase link --project-ref <your-project-ref>` (ref is in Supabase Dashboard → Project Settings).
3. **Set the secret**: `supabase secrets set OPENROUTER_API_KEY=sk-or-...` (or set it in Dashboard → Edge Functions → Secrets).
4. **Deploy**: `supabase functions deploy openrouter-proxy`  
   If the frontend should call the proxy without sending a Supabase JWT (e.g. before sign-in), use:  
   `supabase functions deploy openrouter-proxy --no-verify-jwt` (use only for this public proxy).
5. **Get the URL**: `https://<project-ref>.supabase.co/functions/v1/openrouter-proxy`
6. **In Vercel (or .env)**: add `VITE_OPENROUTER_PROXY_URL=https://<project-ref>.supabase.co/functions/v1/openrouter-proxy`. Do **not** set `VITE_OPENROUTER_API_KEY` in the frontend when using the proxy.

---

## 6. Order of operations (learning path)

1. **Deploy frontend to Vercel** and add Supabase env vars so the app works as today.
2. **Deploy the Open Router proxy** (Supabase Edge Function), add `OPENROUTER_API_KEY` to Secrets, then set `VITE_OPENROUTER_PROXY_URL` in Vercel and remove the Open Router key from the frontend env.
3. **Stripe**: create a Stripe account, get test keys, then add one Edge Function (or Vercel Function) that creates a Checkout Session and returns the URL; from the Pricing page, call that backend and redirect to the URL. After that, add a webhook endpoint that updates `profiles.credits` (or a subscriptions table) when payment succeeds.
4. **Credits/levels**: keep using Supabase for storage; implement the “grant credits on payment” and “deduct credits on AI use” in backend (webhook + existing or new RPC/function).

---

## 7. Useful links (from your screenshots)

- **Stripe**: [API Reference](https://docs.stripe.com/api), [Authentication](https://docs.stripe.com/api/authentication), [Developer resources](https://stripe.com/docs/development). Use **test mode** and never put `sk_test_` or `sk_live_` in the frontend.
- **Stripe samples**: [github.com/stripe-samples](https://github.com/stripe-samples) — e.g. `checkout-one-time-payments`, `checkout-single-subscription` for backend + frontend patterns.
- **Supabase**: Dashboard → **Edge Functions** (deploy server-side logic), **Secrets** (store API keys), **Integrations** (e.g. Vercel).
- **Vercel**: Project → **Environment Variables** for frontend env; serverless functions in `/api` if you use Vercel as backend.

---

## 8. Short summary

- **Frontend** = what runs in the browser (your React app). No secret keys here.
- **Backend** = code on a server (Supabase Edge Functions or Vercel Functions). Secret keys and payment/AI logic go here.
- **Payment logic** = backend creates Stripe Checkout / Payment Intent; Stripe sends webhooks to your backend; backend updates Supabase (credits/levels).
- **Credits/levels logic** = stored in Supabase; updated by backend (webhooks, RPC, or Edge Functions).
- **AI logic** = backend proxies Open Router (we added `openrouter-proxy`); frontend calls your proxy URL instead of Open Router with a key.

Once the proxy is deployed and the frontend uses it, you’ve got a clear path to add Stripe and webhook-driven credits/levels on top of the same backend pattern.
