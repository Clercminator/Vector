# Prompt: Analytics Event Tracking & Referral/Influencer System (Vector app)

## Context

**Vector** is a React (TypeScript) web app that helps users turn goals into structured plans via an AI Goal Wizard. You are implementing analytics and referral tracking so the team can:

1. **Track leading indicators** for the conversion funnel: signup → first blueprint → paid.
2. **Attribute signups and sales to influencers/partners** for commission payouts and performance tracking.

The app already has an `analytics_events` table and a `trackEvent` function in `src/lib/analytics.ts`. Currently only `framework_selected` and `view_dashboard` are fired. Several critical events are defined but never triggered, and referral/influencer infrastructure does not exist.

---

## Part 1: Event Tracking Gaps

### 1.1 Current State

- **Analytics module**: `src/lib/analytics.ts`
- **Event types in type definition**: `blueprint_created`, `framework_selected`, `export_pdf`, `login`, `view_dashboard`, `view_community`
- **Events actually fired**: `framework_selected` (FrameworkPage), `view_dashboard` (Dashboard)
- **Storage**: `analytics_events` table (`user_id`, `event_type`, `data` JSONB, `created_at`). Events are only recorded for **authenticated users** (current implementation returns early if no user).

### 1.2 Required New Event Types

Add these to the `EventType` union in `src/lib/analytics.ts`:

| Event Type | When to Fire | Meta (data) |
|------------|--------------|-------------|
| `blueprint_created` | When a blueprint is successfully saved (persisted to Supabase) | `{ framework: string, is_first: boolean }` |
| `wizard_started` | When user enters the Goal Wizard (navigates to `/wizard` with a framework or consultant flow) | `{ framework?: string }` |
| `wizard_completed` | When the AI delivers the final blueprint (result is set and shown to user) | `{ framework: string }` |
| `view_pricing` | When the Pricing page or section is viewed | `{}` |
| `checkout_started` | When user initiates checkout (before redirect to MercadoPago) | `{ tier: string }` |

You may also add `export_pdf` and `view_community` calls if those actions exist and are meaningful; they are in the type but not used.

### 1.3 Implementation Locations

| Event | Where to Add | Notes |
|-------|--------------|-------|
| `blueprint_created` | `App.tsx` in `handleSaveBlueprint`, after successful `upsertBlueprint` (inside the `retryOperation` success path) | Pass `bp.framework` and compute `is_first` (query blueprints count for user before this insert, or check if `existingIndex < 0` and blueprints.length === 0). Prefer checking blueprint count before this save to determine `is_first`. |
| `wizard_started` | `GoalWizard` or `useGoalWizard` hook—on mount when wizard is active, or when first message is sent. Prefer: **when the wizard component mounts** (user has committed to the flow) | Pass `framework` from props. Only fire once per session if desired (e.g. ref to avoid duplicate on re-render). |
| `wizard_completed` | `useGoalWizard.ts`—when `setResult(bp)` is called with a final blueprint (inside the stream handler where `blueprintFromStream` is applied) | Pass `framework` from the blueprint or from hook state. Fire only when `result` transitions from null to a non-teaser blueprint. |
| `view_pricing` | `PricingSection.tsx`—in a `useEffect` that runs when the component mounts | No meta required. Use `useEffect` with empty deps so it fires once per visit. |
| `checkout_started` | `src/lib/mercadoPago.ts` in `createCheckout`, immediately before `window.open(init_point, ...)` | Pass `tier` from `options.tier`. The function is called from App's `handlePricingTier` which has tier context. |

### 1.4 Authentication Requirement

The current `trackEvent` returns early if `supabase.auth.getUser()` returns no user. For `view_pricing` and `wizard_started`, users might not be logged in yet. You have two options:

- **Option A (recommended for MVP)**: Fire events only when the user is authenticated. `view_pricing` and `wizard_started` will be undercounted for anonymous visitors, but the funnel (signup → blueprint → paid) will be correct for logged-in users.
- **Option B**: Add an optional `trackEventAnonymous(eventType, meta)` that stores `user_id: null` or a session_id for anonymous events. This requires a schema change (allow null `user_id` or add `session_id`) and RLS policy updates. Document this as a follow-up task if not implemented now.

For this task, **use Option A** unless explicitly asked to support anonymous events.

### 1.5 Acceptance Criteria (Part 1)

- [ ] `blueprint_created` fires on successful blueprint save with `{ framework, is_first }`.
- [ ] `wizard_started` fires when the wizard mounts (once per session) with `{ framework? }`.
- [ ] `wizard_completed` fires when the AI delivers a final blueprint with `{ framework }`.
- [ ] `view_pricing` fires when PricingSection mounts.
- [ ] `checkout_started` fires before MercadoPago redirect with `{ tier }`.
- [ ] No regressions: existing `framework_selected` and `view_dashboard` continue to work.
- [ ] Events fail silently (no user-facing errors) if Supabase is unavailable.

---

## Part 2: Referral / Influencer Tracking

### 2.1 Goal

- Capture a referral code from the URL (e.g. `?ref=INFLUENCER_CODE` or `?ref=partner123`).
- Persist the referrer code on the user when they sign up (or when they first land with a ref code and later sign up).
- Allow attribution of signups and paid conversions to referrers for commission reporting.

### 2.2 URL Parameter

- **Parameter name**: `ref` (e.g. `https://yoursite.com/?ref=maria_fitness`, `https://yoursite.com/wizard?ref=pedro_emprende`)
- **Persistence**: Store in `localStorage` (e.g. `vector_ref_code`) when the user lands with `?ref=CODE`. Overwrite only if a new `ref` is present (or use first-touch: keep the first ref seen in the session).
- **Scope**: Valid for 7–30 days (configurable). If the user signs up within that window, associate the ref code with their account.

### 2.3 Schema Changes

Create a migration that adds:

1. **`profiles` table**: Add column `referrer_code TEXT` (nullable). Stores the influencer/partner code at signup or first authenticated session.
2. **`referrers` table** (optional but recommended):
   ```sql
   CREATE TABLE referrers (
     code TEXT PRIMARY KEY,
     display_name TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     metadata JSONB DEFAULT '{}'
   );
   ```
   Used to validate codes and store display names for admin reporting. Codes can be added manually or via an admin UI later.

3. **`analytics_events` or `payments`**: Ensure we can join `profiles.referrer_code` to attribute conversions. No schema change needed if we query via profiles.

### 2.4 Flow

1. **User lands with `?ref=CODE`**: App reads `ref` from `window.location.search` or `useSearchParams()`, validates it (optional: check against `referrers` or allow any non-empty string), and stores in `localStorage` with a timestamp.
2. **User signs up / logs in**: On first authenticated session (e.g. in App's auth effect or when profile is created), check `localStorage` for `vector_ref_code`. If present and not expired, set `profiles.referrer_code = CODE` for that user. Clear or leave the localStorage entry (your choice; clearing avoids re-attribution on next login).
3. **Payment completed**: The `payments` table already has `user_id`. Join with `profiles` to get `referrer_code`. Commission reporting: for each payment, look up the paying user's `referrer_code` and attribute the sale to that referrer.

### 2.5 Events for Referral Attribution

Fire `trackEvent('signup_referred', { referrer_code: string })` when we persist the referrer code to a new user's profile (first time only). This allows analytics queries to count referred signups.

Fire `trackEvent('payment_referred', { referrer_code: string, amount: number })` when a payment is completed and the user has a `referrer_code`. This can be done in the MercadoPago webhook handler (Edge Function) when updating the user's tier/credits and inserting into `payments`. The webhook runs server-side, so you would need to call `supabase.from('analytics_events').insert(...)` from the Edge Function with the appropriate `user_id` and event data. Alternatively, the client could fire `payment_completed` when redirected back with `?payment=success`—but that is less reliable (user might close the tab). **Preferred**: handle `payment_referred` in the webhook.

### 2.6 Admin Reporting (Optional)

Add a simple admin view or extend `AdminPayments` to show:
- Referrer code breakdown: count of signups and paid conversions per `referrer_code`
- Requires SQL or a Supabase RPC that aggregates `profiles` (referrer_code) and `payments` (via user_id → profiles).

This can be a follow-up task if time is limited; the critical piece is persisting the ref and being able to query it.

### 2.7 Acceptance Criteria (Part 2)

- [ ] URL param `ref` is read on app load and stored in `localStorage` (with optional expiry).
- [ ] Migration adds `referrer_code` to `profiles` and optionally creates `referrers` table.
- [ ] On first authenticated session, if `localStorage` has a valid ref code, set `profiles.referrer_code` and fire `signup_referred` (or equivalent).
- [ ] Payments can be attributed to a referrer via `profiles.referrer_code`.
- [ ] (Optional) Webhook fires `payment_referred` when a payment completes and user has referrer_code.
- [ ] (Optional) Admin view shows signups and conversions per referrer code.

---

## Part 3: Technical Constraints

### 3.1 Existing Code

- **trackEvent**: `src/lib/analytics.ts` — only tracks authenticated users. Signature: `trackEvent(eventType: EventType, meta?: Record<string, any>)`.
- **handleSaveBlueprint**: `App.tsx` around line 339.
- **createCheckout**: `src/lib/mercadoPago.ts` — receives `options: CreateCheckoutOptions` with `tier`, `title`, etc.
- **PricingSection**: `src/app/components/PricingSection.tsx` — no analytics currently.
- **useGoalWizard**: `src/app/components/wizard/useGoalWizard.ts` — handles streaming and `setResult`.
- **MercadoPago webhook**: Supabase Edge Function `mercado-pago-webhook` — updates profiles and inserts into `payments`. To add `payment_referred`, modify this function.

### 3.2 Do Not

- Break existing auth or payment flows.
- Expose referral codes in client-side logs in a way that could leak partner data.
- Add blocking calls before redirects; fire `checkout_started` and redirect without waiting for the event to complete (fire-and-forget).

### 3.3 Out of Scope

- Commission payout automation (that is a separate product/ops task).
- Binance Pay or other payment methods.
- Stripe integration.
- Changing how MercadoPago or Supabase auth work beyond what is needed for ref attribution.

---

## Part 4: Summary Checklist

**Event Tracking:**
- [ ] Add new event types to `analytics.ts`.
- [ ] Fire `blueprint_created` in `handleSaveBlueprint`.
- [ ] Fire `wizard_started` in Goal Wizard on mount.
- [ ] Fire `wizard_completed` when final blueprint is delivered.
- [ ] Fire `view_pricing` in PricingSection on mount.
- [ ] Fire `checkout_started` in `createCheckout` before redirect.

**Referral System:**
- [ ] Read `ref` from URL and store in localStorage.
- [ ] Migration: `referrer_code` on profiles; optional `referrers` table.
- [ ] Persist referrer to profile on first authenticated session.
- [ ] Attribute payments to referrer (profiles.referrer_code).
- [ ] (Optional) Fire `payment_referred` in webhook; admin report per referrer.
