# Vector — AI-Powered Goal Architect

**Vector** is a web app that helps you turn big, fuzzy goals into clear plans. You pick a “framework” (a proven way to think about goals—like First Principles or the 80/20 rule), answer a few questions, and the app turns your answers into a structured blueprint you can save, export to your calendar, or share.

This document explains **what the app does**, **how it’s built**, **how the pieces connect**, and **how you can change or extend it**—including if you’re not a developer.

---

## Table of Contents

- [Vector — AI-Powered Goal Architect](#vector--ai-powered-goal-architect)
  - [Table of Contents](#table-of-contents)
  - [What Vector Does (In Plain Language)](#what-vector-does-in-plain-language)
  - [What We Built \& Why](#what-we-built--why)
  - [How to Run the App](#how-to-run-the-app)
  - [Deploying Vector: Open Router API Key (Beginner Guide)](#deploying-vector-open-router-api-key-beginner-guide)
  - [Frameworks: List and Explanation](#frameworks-list-and-explanation)
    - [1. First Principles (Elon Musk)](#1-first-principles-elon-musk)
    - [2. Pareto Principle (80/20)](#2-pareto-principle-8020)
    - [3. Tony Robbins RPM (Rapid Planning Method)](#3-tony-robbins-rpm-rapid-planning-method)
    - [4. Eisenhower Matrix](#4-eisenhower-matrix)
    - [5. OKR (Objectives and Key Results)](#5-okr-objectives-and-key-results)
  - [How the AI Works](#how-the-ai-works)
    - [Planner Generator Coach agent (Goal Wizard chat)](#planner-generator-coach-agent-goal-wizard-chat--step-by-step)
  - [LangSmith Tracing (Debugging the AI)](#langsmith-tracing-debugging-the-ai)
    - [Fix: Agent Not Responding and "No API key found"](#fix-agent-not-responding-and-no-api-key-found-simple-explanation)
  - [How Levels and Credits Work](#how-levels-and-credits-work)
  - [Architecture](#architecture)
    - [Frontend / Backend Split](#frontend--backend-split)
    - [Component Architecture](#component-architecture)
  - [Tech Stack](#tech-stack)
  - [Efficiency, Advantages and Disadvantages](#efficiency-advantages-and-disadvantages)
    - [Efficiency](#efficiency)
    - [Advantages](#advantages)
    - [Disadvantages](#disadvantages)
  - [What Can Be Improved](#what-can-be-improved)
    - [Already implemented](#already-implemented)
    - [Suggested improvements](#suggested-improvements)
    - [Previously identified gaps — now addressed](#previously-identified-gaps--now-addressed)
  - [Project Structure: Where Everything Lives](#project-structure-where-everything-lives)
  - [How Everything Is Connected](#how-everything-is-connected)
  - [How to Change or Add Things](#how-to-change-or-add-things)
    - [Add the Desktop Recommendation Banner to another view](#add-the-desktop-recommendation-banner-to-another-framework-view)
    - [Add or edit a framework](#add-or-edit-a-framework)
    - [Add a new language](#add-a-new-language)
    - [Change or add copy (buttons, labels, messages)](#change-or-add-copy-buttons-labels-messages)
    - [Add or edit inspirational quotes](#add-or-edit-inspirational-quotes)
    - [Add a new section or screen](#add-a-new-section-or-screen)
    - [Add or change community templates behavior](#add-or-change-community-templates-behavior)
    - [Change SEO or social preview](#change-seo-or-social-preview)
    - [Change theme (colors, fonts)](#change-theme-colors-fonts)
  - [Technical Summary (For Developers)](#technical-summary-for-developers)
  - [Attribution](#attribution)

---

<a id="what-vector-does-in-plain-language"></a>
## What Vector Does (In Plain Language)

- **Landing page**  
  You see a big headline (“Architect Your Ambition”), a rotating inspirational quote, and cards for five goal frameworks. Each card has a short description. You can click a card to start building a plan with that framework, or click “Learn more” (info icon) to see details: author, definition, pros, cons, and an example.

- **Goal Wizard**  
  You pick a framework (e.g. Pareto 80/20). The app asks you a few questions in a chat-style flow. When you’re done, it uses **AI** (when configured) to turn your answers into a structured blueprint—for example “Vital Few” vs “Trivial Many” for Pareto, or four quadrants for Eisenhower. You can then **save** the blueprint, **export** it to Google Calendar (or download an .ics file), or **restart** with a new goal.

- **My Blueprints**  
  All blueprints you save appear here (with "Load more" when signed in). You can open one to see the result again, export it, delete it, publish as template, or bulk-export to PDF (Max tier). Data is stored in your browser and, if you’re signed in, in the cloud (Supabase).

- **Profile**  
  When you’re signed in, you get a profile page: display name, bio, avatar image URL, level (gamification), and credits (used for AI-generated blueprints). You can edit your info and see how many credits you have left.

- **Community**  
  Users can publish blueprints as **templates**. On the Community page you see those templates (with "Load more" and sort by recent/top), can **vote** on them, **use** one (import it into your blueprints), or **gift points** to the author.

- **Pricing**  
  Four tiers: **Architect** (free), **Standard** (15 credits, all frameworks, one-time), **Max** (40 credits, calendar/PDF export, priority AI, one-time), **Enterprise** (contact). Standard and Max use MercadoPago checkout when configured; prices are one-time (no subscription yet).

- **Languages & theme**  
  You can switch **language** (e.g. English / Español) and **theme** (light/dark) from the nav. All visible text and framework content can be translated.

- **Share**  
  A “Share” button in the footer uses your device’s share menu when available, or copies the app link to the clipboard.

- **Onboarding**  
  The first time you visit, a short onboarding modal appears: welcome, “choose a mental model,” and a tip (e.g. save blueprints, export to calendar). Completing or skipping it is remembered so it doesn’t show again.

- **SEO & social sharing**  
  The app’s HTML includes a short description and Open Graph / Twitter tags so links look good when shared. Per-framework pages at `/frameworks/:id` have their own title, description, and OG meta (via react-helmet-async) for better discovery and sharing.

---

<a id="what-we-built-and-why"></a>
## What We Built & Why

| What we built | Why |
|----------------|-----|
| **Five frameworks** (First Principles, Pareto, RPM, Eisenhower, OKR) | Each gives a different lens (break down from basics, focus on 20%, align result/purpose/actions, prioritize by urgency/importance, set objectives and key results). |
| **AI-backed blueprints** | After you answer, an AI (Open Router) structures your answers into the right format. If the AI isn’t configured or fails, the app falls back to simple rule-based parsing so the wizard still works. |
| **Supabase (auth + database)** | So you can sign in with a magic link (no password), and your blueprints and profile can sync across devices. |
| **Profile (level + credits)** | To gamify usage (level) and to limit AI usage per user (credits) for cost control. |
| **Community (templates, vote, gift)** | So users can share and reuse plans and reward each other. |
| **Translations (e.g. EN / ES)** | So the app and all framework text can be used in multiple languages from one codebase. |
| **Light/dark theme** | So the app is comfortable in different environments. |
| **Onboarding** | So new users quickly understand value and how to start. |
| **Inspirational quotes** | To keep the product feeling motivating. |
| **Share button** | To make it easy to send the app to friends. |
| **SEO meta + Open Graph** | So the app looks good in search and when shared on social. |

---

<a id="how-to-run-the-app"></a>
## How to Run the App

1. **Install dependencies**  
   In the project folder, run:  
   `npm install`

2. **Configure environment**  
   Create a `.env` file in the **project root** with at least:
   - `VITE_SUPABASE_URL` (or `VITE_supabase_url`) — your Supabase project URL  
   - `VITE_ANON_PUBLIC_KEY` — Supabase anon (public) key  
   Optional: `VITE_OPENROUTER_PROXY_URL` (recommended for production) or `VITE_OPENROUTER_API_KEY` for AI; `VITE_GOOGLE_OAUTH_CLIENT_ID` for Google Calendar export; `VITE_MERCADOPAGO_PUBLIC_KEY` for pricing checkout. Backend-only keys (e.g. MercadoPago Access Token, Open Router API key) go in Supabase Secrets or `.env.backend`.

3. **Start the app**  
   Run:  
   `npm run dev`  
   Open the URL shown (usually http://localhost:5173).

4. **Database**  
   In the Supabase dashboard, run the migrations in **`supabase/migrations/`** in order:
   - `20240101000000_baseline_schema.sql` (profiles, blueprints, community_templates, template_votes)
   - `20240131000000_create_analytics_events.sql`
   - `20260131_chat_history.sql` (blueprint_messages table)
   - `20260131_admin_updates.sql` (is_admin, template status/featured, RLS)
   - `20260201_admin_enhancements.sql` (payments table for AdminPayments)
   - `20260201_leaderboard_function.sql` (get_leaderboard RPC)

   Ensure **`decrement_credits`** and **`increment_credits`** RPCs and a **`tier`** column on `profiles` exist; add these in Supabase if not present (see Edge Function webhook and GoalWizard usage).

5. **Backend (payments, secure AI, credits/levels)**  
   The app uses **Supabase Edge Functions** for backend logic:
   - **openrouter-proxy** — Proxies AI requests; API key stays server-side.
   - **mercado-pago-preference** — Creates MercadoPago checkout; returns `init_point` URL.
   - **mercado-pago-webhook** — Handles payment notifications; updates `profiles.credits` and `profiles.tier` via `increment_credits` RPC; calls **send-email** for receipt.
   - **send-email** — Sends transactional emails (receipt after purchase). Called by mercado-pago-webhook. Uses Resend (or similar); requires `RESEND_API_KEY` or equivalent in Supabase Secrets.
   - **handle-new-user** — Triggered by Supabase Database Webhook (INSERT on `auth.users`). Sends welcome email via Resend. Requires `RESEND_API_KEY` and a Database Webhook configured in Supabase Dashboard.
   
   **Already deployed:** Edge Functions, Supabase Secrets (`OPENROUTER_API_KEY_2` or `OPENROUTER_API_KEY` for the AI proxy, `MERCADOPAGO_ACCESS_TOKEN`), frontend env vars (`VITE_OPENROUTER_PROXY_URL`, `VITE_MERCADOPAGO_PUBLIC_KEY`), MercadoPago webhook configured. Ensure `profiles.tier` and the credit RPCs exist in your database. See **[Deploying Vector: Open Router API Key](#deploying-vector-open-router-api-key-beginner-guide)** for a step-by-step guide.
   
   **Stripe** (future US implementation): See **[integrations/pending/stripe/](integrations/pending/stripe/)**.

---

<a id="deploying-vector-open-router-api-key-beginner-guide"></a>
## Deploying Vector: Open Router API Key (Beginner Guide)

This section explains **exactly** where and how to set the Open Router API key so the AI (Planner Generator Coach and blueprint generation) works after you deploy. If you are new to deployment, read this step by step.

### What “deploy” means here

- **Local:** You run `npm run dev` on your computer. The app talks to Supabase and (if configured) to Open Router. This uses your `.env` and optionally `.env.backend`.
- **Deploy:** You put the app on the internet (e.g. Vercel hosts the frontend, Supabase hosts the database and Edge Functions). The code no longer runs on your machine, so it cannot read your local `.env` or `.env.backend`. You must type the same values into the **hosting dashboards** (Vercel and Supabase) as **Environment Variables** or **Secrets**.

### Why the Open Router key matters

- The app uses **Open Router** to call AI models (e.g. DeepSeek, Gemini). Open Router needs an **API key** to know the requests are from you and to bill you.
- That key is a long string (e.g. `sk-or-v1-...`). You get it from [Open Router](https://openrouter.ai/).
- The app is built to prefer a key named **`VITE_OPENROUTER_API_KEY_2`** (you can also use `VITE_OPENROUTER_API_KEY`). In your **local** setup you might keep this in **`.env.backend`** (which is gitignored so it is never pushed to GitHub).

### Two places that can use the key

There are **two** ways the frontend can talk to Open Router:

1. **Through the proxy (recommended for production)**  
   - The **browser** sends the request to **your Supabase Edge Function** (`openrouter-proxy`).  
   - The **Edge Function** then calls Open Router with **its own** key (stored in Supabase Secrets).  
   - So the key never appears in the browser or in the frontend build. That is more secure.

2. **Direct from the browser**  
   - The **browser** calls Open Router directly.  
   - The key must then be in the **frontend** environment (e.g. Vercel env vars).  
   - Anyone can see it in the built JavaScript if they look. So we only recommend this for quick testing, not for production.

The app is configured to use the **proxy** when you set **`VITE_OPENROUTER_PROXY_URL`**. Your `.env` already has that (pointing to the Supabase function). So in production we rely on the **proxy** and its key.

### Deploy checklist (step-by-step)

Do both parts: **1. Frontend (Vercel)** and **2. Backend (Supabase)**.

---

#### 1. Frontend (Vercel) — what the browser needs

Vercel hosts the React app. At **build time**, Vite bakes environment variables that start with **`VITE_`** into the JavaScript. So you must define them in **Vercel**, not only in `.env` on your computer.

**Steps:**

1. Go to [Vercel](https://vercel.com) and open your **Vector** project.
2. Open **Settings** → **Environment Variables**.
3. Add or confirm these variables (use **Production**, and optionally **Preview** and **Development** if you use them):

   | Name | Value | Notes |
   |------|--------|--------|
   | `VITE_OPENROUTER_PROXY_URL` | `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/openrouter-proxy` | Replace `YOUR_SUPABASE_PROJECT_REF` with your real Supabase project ref (e.g. `rfemwgtomtzbwhfgpcuo`). Same as in your local `.env`. |
   | `VITE_SUPABASE_URL` | `https://YOUR_SUPABASE_PROJECT_REF.supabase.co` | Your Supabase project URL. |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | So the app can talk to Supabase (auth, database). |

   **Do you need to put the Open Router key in Vercel?**

   - **If you use the proxy (recommended):** You do **not** need to put `VITE_OPENROUTER_API_KEY_2` or `VITE_OPENROUTER_API_KEY` in Vercel. The browser will call the proxy URL; the proxy (on Supabase) will use the key stored in Supabase Secrets.
   - **If you ever want to call Open Router without the proxy** (e.g. for a quick test): You would add `VITE_OPENROUTER_API_KEY_2` (or `VITE_OPENROUTER_API_KEY`) in Vercel. But then the key is visible in the built app, so we do **not** recommend this for production.

4. Save. Then trigger a **new deployment** (e.g. **Deployments** → **Redeploy** or push a new commit) so the new variables are used in the build.

**Summary for Vercel:** Set `VITE_OPENROUTER_PROXY_URL` (and Supabase URL/keys). Do **not** put the Open Router API key in Vercel when using the proxy.

---

#### 2. Backend (Supabase) — what the proxy needs

The **openrouter-proxy** Edge Function runs on Supabase. It receives requests from the browser and forwards them to Open Router. It needs the Open Router API key **only on the server** (Supabase), not in the browser.

**Steps:**

1. Go to [Supabase](https://supabase.com) and open your **Vector** project.
2. In the left sidebar, open **Edge Functions** (or **Project Settings** → **Edge Functions**).
3. Find where **Secrets** (or **Environment Variables** for Edge Functions) are set. This is often under **Project Settings** → **Edge Functions** → **Secrets**, or in the Edge Functions page.
4. Add or edit a secret:
   - **Name:** `OPENROUTER_API_KEY_2` (recommended) or `OPENROUTER_API_KEY`
   - **Value:** Your Open Router API key (the long `sk-or-v1-...` string). You can copy it from your **`.env.backend`** file (the line `VITE_OPENROUTER_API_KEY_2=sk-or-v1-...` — copy only the part after the `=`).
5. Save. The proxy code is written to use **`OPENROUTER_API_KEY_2`** first; if that is not set, it uses **`OPENROUTER_API_KEY`**. So one of them must be set.

**Important:** Supabase Edge Functions do **not** read your local `.env.backend` file. You must paste the key into the Supabase dashboard. Treat it like a password: only put it in Supabase Secrets, and do not commit it to Git.

**Summary for Supabase:** Set the secret **`OPENROUTER_API_KEY_2`** (or **`OPENROUTER_API_KEY`**) to your Open Router key so the proxy can call Open Router.

---

### How it works end-to-end (with the proxy)

1. User types in the Goal Wizard → the browser sends a request to **`VITE_OPENROUTER_PROXY_URL`** (your Supabase Edge Function).
2. The Edge Function reads **`OPENROUTER_API_KEY_2`** (or **`OPENROUTER_API_KEY`**) from its environment and calls Open Router with that key.
3. Open Router returns the AI response; the proxy returns it to the browser.
4. The browser never sees the key; only Supabase and Open Router use it.

### Using the correct key (e.g. Vector vs Optiland)

When you use the **proxy** (`VITE_OPENROUTER_PROXY_URL`), the browser does **not** send your Open Router key to Open Router. The **Supabase Edge Function** sends the key that is stored in **Supabase Secrets**. So the key that appears in the Open Router dashboard as “Last used” is the one from **Supabase**, not from Vercel or `.env.backend`.

- If Open Router shows the **wrong** key (e.g. “Optiland” instead of “Vector”): the proxy is using whatever is in Supabase Secrets.
- **Fix:** In Supabase → **Edge Functions** → **Secrets**, set **`OPENROUTER_API_KEY_2`** to the key you want to use (e.g. copy the value of **`VITE_OPENROUTER_API_KEY_2`** from your `.env.backend` — the one named “Vector” in Open Router). The proxy prefers `OPENROUTER_API_KEY_2` over `OPENROUTER_API_KEY`. Save and redeploy the Edge Function if needed so the new secret is picked up.
- After that, new completions will use the Vector key and it should show as “Last used” in Open Router for that key.

### Quick verification after deploy

1. Open your deployed app (e.g. `https://your-app.vercel.app`).
2. Go to the Goal Wizard (e.g. pick a framework and start a conversation).
3. Send a message (e.g. “I want to run a marathon in 6 months”).  
   - If the coach replies, the proxy and Open Router key are set correctly.  
   - If you see an error like “OPENROUTER_API_KEY_2 or OPENROUTER_API_KEY not configured”, the Supabase secret is missing or the Edge Function was not redeployed after adding it.
4. If you use the proxy, you can also check the **Supabase Edge Function logs** for the `openrouter-proxy` function to see if requests are coming in and if any errors are returned.

### Summary table

| Where | What to set | Why |
|-------|-------------|-----|
| **Vercel** (frontend) | `VITE_OPENROUTER_PROXY_URL`, `VITE_SUPABASE_URL`, Supabase anon key | So the built app knows where to call the proxy and Supabase. |
| **Vercel** (frontend) | Do **not** set Open Router key when using proxy | The key stays on the server (Supabase). |
| **Supabase** (Edge Function secrets) | `OPENROUTER_API_KEY_2` (or `OPENROUTER_API_KEY`) = your `sk-or-v1-...` key | So the openrouter-proxy can call Open Router on behalf of the app. |

If you follow these steps, the deploy checklist for the Open Router key is complete: the frontend uses the proxy URL, and the proxy uses the key stored in Supabase.

---

<a id="frameworks-list-and-explanation"></a>
## Frameworks: List and Explanation

Vector uses five goal-setting frameworks. Each gives a different mental model for breaking down ambitions into actionable plans.

| Framework | Author | One-line idea |
|-----------|--------|----------------|
| **First Principles** | Elon Musk / Aristotle | Break problems into basic truths, then rebuild from zero. |
| **Pareto (80/20)** | Vilfredo Pareto | Focus on the 20% of efforts that yield 80% of results. |
| **RPM** | Tony Robbins | Result (what), Purpose (why), Massive Action Plan (how). |
| **Eisenhower Matrix** | Dwight D. Eisenhower | Sort tasks by urgency and importance into four quadrants. |
| **OKR** | John Doerr / Andy Grove | Set one Objective and a few measurable Key Results. |

### 1. First Principles (Elon Musk)

- **Definition:** Break a problem into its fundamental truths (no analogy or convention), then reassemble a solution from the ground up.
- **Pros:** Encourages innovation, removes assumptions, leads to unique solutions.
- **Cons:** Time-consuming, mentally taxing, requires deep understanding.
- **Example:** SpaceX reduced rocket cost by calculating raw material cost instead of buying pre-assembled parts.
- **When to use:** When you want to question the “obvious” way of doing things and design a new approach.

### 2. Pareto Principle (80/20)

- **Definition:** For many outcomes, roughly 80% of consequences come from 20% of causes.
- **Pros:** Increases efficiency, focuses resources, simple to apply.
- **Cons:** Oversimplifies complex systems; the 80/20 ratio is an estimate; can miss small but crucial details.
- **Example:** A software team fixes the top 20% of reported bugs to resolve 80% of user crashes.
- **When to use:** When you need to prioritize ruthlessly and cut “trivial many” in favor of the “vital few.”

### 3. Tony Robbins RPM (Rapid Planning Method)

- **Definition:** Define the **Result** (what you want), the **Purpose** (why it matters), and a **Massive Action Plan** (how you’ll get there).
- **Pros:** Highly motivating, aligns actions with values, reduces busy work.
- **Cons:** Can feel overwhelming at first; requires emotional buy-in; less rigid than other frameworks.
- **Example:** Instead of “Go to gym,” the goal is “Vibrant health” (Result) because “I want energy for my kids” (Purpose) by “Running 3×/week” (Map).
- **When to use:** When you want goals tied to meaning and a clear “why,” not just a to-do list.

### 4. Eisenhower Matrix

- **Definition:** Split tasks into four quadrants: **Urgent & Important** (do first), **Important, not urgent** (schedule), **Urgent, not important** (delegate), **Neither** (eliminate).
- **Pros:** Clear prioritization, reduces procrastination, gives a delegation framework.
- **Cons:** Categorization is subjective; doesn’t account for effort; can become a procrastination tool.
- **Example:** “Server down” → Q1; “Strategic planning” → Q2; “Most emails” → Q3; time-wasters → Q4.
- **When to use:** When you’re overwhelmed by tasks and need to separate “do now” from “schedule” and “drop.”

### 5. OKR (Objectives and Key Results)

- **Definition:** Set one ambitious **Objective** (qualitative) and 3–5 **Key Results** (measurable outcomes) over a set period (e.g. 90 days).
- **Pros:** Aligns teams, measurable progress, encourages ambition.
- **Cons:** Can be too rigid; setting good metrics is hard; missed targets can demotivate.
- **Example:** Objective: “Increase brand awareness.” Key Result: “Reach 10,000 active monthly users.”
- **When to use:** When you want measurable, time-bound goals (personal or team) with clear success criteria.

In the app, each framework has a **detail modal** (Learn more) with author, definition, pros, cons, and example. The **Goal Wizard** asks framework-specific questions and produces a structured blueprint (e.g. Vital/Trivial for Pareto, four quadrants for Eisenhower).

---

<a id="how-the-ai-works"></a>
## How the AI Works

Vector uses **Open Router** to turn your questionnaire answers into a structured blueprint when an API key is configured.

### Planner Generator Coach agent (Goal Wizard chat) — step-by-step

When you chat with the “Planner Generator Coach” in the Goal Wizard, a **LangGraph agent** (`src/agent/goalAgent.ts`) runs in the browser. Here is how it works: flow, nodes, routes, tools, and timeouts.

**1. Single run, one message**

Each time you send a message, the app calls `graph.stream(inputs, config)` once. The graph runs until it reaches a “wait for user” state (END) or finishes generating a blueprint. So one user message can trigger several internal steps (nodes) before the next reply appears.

**2. Nodes (what runs)**

| Node | What it does | Calls Open Router? |
|------|----------------|--------------------|
| **consultant** | First reply: suggests frameworks, asks about goal/timeline. Runs when there is no framework set yet. | Yes (with tools) |
| **ask** | Follow-up replies: refines the plan, asks 1–2 questions, can update a “draft” JSON. Runs when a framework is already chosen. | Yes (with tools) |
| **framework_setter** | Applies the “switch framework” tool: updates state and adds a short confirmation message. | No |
| **tools** | Runs the LLM’s tool calls (e.g. set_framework, generate_blueprint). | No |
| **validator** | Checks the draft JSON block in the last message; if invalid, injects a correction and sends the flow back to consultant/ask. | No |
| **draft** | Generates the final blueprint JSON from the conversation. | Yes (no tools) |
| **critique** | Reviews the blueprint; if it fails, sends the flow back to draft. | Yes (no tools) |

**3. Tools (what the LLM can “call”)**

- **set_framework** — User asks to change method (e.g. from First Principles to OKR). The graph then goes to **framework_setter** and then back to **ask**.
- **generate_blueprint** — User says they’re ready (e.g. “yes”, “listo”). The graph goes to **draft** to produce the final blueprint.

**4. Routes (possible paths)**

- **START** → If no framework: **consultant**. If framework already set: **ask**.
- After **consultant** or **ask** → **validator** (always).
- **validator** →  
  - If draft JSON was invalid and we injected a correction → **consultant** or **ask** (to re-answer).  
  - Else: **END** (wait for user), or **framework_setter** (LLM called set_framework), or **tools** (LLM called a tool), or **draft** (LLM called generate_blueprint).
- **framework_setter** → **ask**.
- **tools** → **ask**.
- **draft** → **critique** → **draft** again (if critique failed) or **END**.

So the “possible routes” are: consultant ↔ validator, ask ↔ validator, sometimes framework_setter → ask, tools → ask, and when the user is ready: validator → draft → critique → (draft again or END).

**5. Model fallback and timeouts**

- Every Open Router call goes through **invokeWithFallback**: it tries the **primary model** (DeepSeek V3.2) first, then, in order: Gemini 3 Flash Preview, Kimi K2.5, Gemini 2.0 Flash, OpenAI GPT-4o.
- **Per-model timeout:** Each model attempt is limited to **35 seconds**. If that model doesn’t respond within 35s, the agent **does not** wait longer; it **tries the next model** in the list. So if DeepSeek is slow or stuck, the user gets a reply from a fallback model instead of a generic “timeout” error.
- **Stream timeout (GoalWizard):** The UI waits up to **35 seconds** for the *first* reply from the agent (first event from the stream). If nothing arrives in 35s, the user sees “Timeout: Agent is taking too long to respond.” With the 35s per-model timeout inside the agent, the first reply should usually come within 35s (from either the primary or a fallback model), unless the network or Open Router is severely slow.

**6. Why you might still see “took too long”**

- Previously the **stream** timeout was 15s. So even if DeepSeek was going to answer in 20s, the UI gave up at 15s and showed a connection error. That timeout is now **35s** so it matches the per-model limit.
- If the **first** model (e.g. DeepSeek) really takes more than 35s (e.g. cold start, overloaded provider), the agent now **automatically tries the next model** instead of failing the whole run. So the user can wait up to 35s for the first reply, and the fallback model is used when the first one is too slow.

---

1. **When it runs:** After you answer the last question in the Goal Wizard, the app sends your answers to Open Router (model: `openai/gpt-4o-mini` by default).
2. **What is sent:** A **system prompt** (framework-specific) that describes the exact JSON shape (e.g. `truths`, `newApproach` for First Principles; `vital`, `trivial` for Pareto). The **user message** is: framework name + numbered list of your answers.
3. **What comes back:** The model is instructed to return **only** valid JSON. The app strips markdown code fences if present, parses the JSON, and validates it against the expected schema for that framework. If validation fails, the result is discarded.
4. **Fallback:** If `VITE_OPENROUTER_API_KEY` is missing, the request fails, or the response is invalid, the app uses a **rule-based** `generateResult` in `GoalWizard.tsx`: simple string splitting (commas, newlines) and mapping into the same blueprint shape. The wizard always produces a result; AI only improves structure and nuance.
5. **Security note:** The API key is read from the frontend env (`VITE_OPENROUTER_API_KEY`), so it is exposed in the client. For production, use a backend proxy that holds the key and calls Open Router server-side.

Relevant code: `src/lib/openrouter.ts` (API client, system prompts, JSON parsing/validation) and `src/app/components/GoalWizard.tsx` (calls `generateBlueprintResult`, then falls back to `currentConfig.generateResult(answers)`).

---

<a id="langsmith-tracing"></a>
## LangSmith Tracing (Debugging the AI)

LangSmith is a tool that lets you see what the AI agent is doing—each question it asks, each reply it gets, and each step in between. It’s useful for debugging and improving the agent.

### Why Our Traces Don’t Show Up (Simple Explanation)

The agent runs in your browser. For LangSmith to record traces, the browser has to send data to LangSmith’s servers. That fails for two main reasons:

1. **Security and privacy**: LangSmith’s official guidance says you should *not* put your LangSmith API key in the browser. Anyone can see it in the page source. We’ve tried it anyway, but it’s unsafe.
2. **Network blocking**: When the browser tries to send trace data to LangSmith’s site, the request is often blocked by the browser’s security rules (CORS). LangSmith’s servers aren’t set up to accept these requests directly from web pages.

So even when we configure tracing, the data never reaches LangSmith.

### Why Our Traces Don’t Show Up (Technical Explanation)

- **CORS**: The LangSmith API (`https://api.smith.langchain.com`) does not expose `Access-Control-Allow-Origin` for arbitrary origins. The tracer uses `fetch()` from the browser; cross-origin requests are blocked before they complete.
- **API key exposure**: Any variable starting with `VITE_` in `.env` is embedded in the client bundle. Putting `VITE_LANGCHAIN_API_KEY` or `VITE_LANGSMITH_API_KEY` in the frontend exposes the key to anyone who inspects the app. LangSmith’s docs explicitly advise against this.
- **`process.env`**: LangChain’s tracer expects `process.env`, which doesn’t exist in the browser. We use a polyfill (`window.process.env`), but some internals may read env vars at import time, before the polyfill runs.
- **Best practice**: LangSmith recommends a *token exchange service* or *proxy* on the backend. The frontend should never talk to LangSmith directly; instead, it talks to our server, which adds the API key and forwards the request.

### How to Set Up LangSmith Correctly (Simple Explanation)

To use LangSmith when the agent runs in the browser, we need a small backend service (similar to the OpenRouter proxy) that:

1. Receives trace data from the browser.
2. Adds the LangSmith API key securely (kept only on the server).
3. Sends the data to LangSmith on behalf of the app.

That way the key stays private and the browser’s security rules no longer block the request.

### How to Set Up LangSmith Correctly (Technical Explanation)

1. **Create a LangSmith proxy Edge Function** (e.g. `langsmith-proxy`), analogous to `openrouter-proxy`. It accepts POST requests with trace payloads, adds the `LANGSMITH_API_KEY` from Supabase Secrets, and forwards to `https://api.smith.langchain.com`.
2. **Configure the tracer** to use the proxy URL instead of LangSmith’s direct URL (via `LANGCHAIN_ENDPOINT` or equivalent, if supported by the LangSmith JS client).
3. **Keep secrets server-side**: Store `LANGSMITH_API_KEY` (or `LANGCHAIN_API_KEY`) only in Supabase Edge Function Secrets or `.env.backend`. Do *not* put it in `.env` with a `VITE_` prefix.
4. **Alternative**: Use LangSmith’s **Collector-Proxy** (beta), which is built for this use case. See [LangSmith Collector-Proxy docs](https://docs.smith.langchain.com/observability/how_to_guides/collector_proxy).
5. **Environment files**: `.env` holds frontend-safe variables (e.g. `VITE_SUPABASE_URL`). `.env.backend` is gitignored and holds secrets (API keys, etc.). Ensure `.env` is in `.gitignore` if it contains secrets, or use a `.env.example` template without real keys.

### What We’ve Tried (and Why It Failed)

- Polyfilling `process.env` in the browser → tracer may read env before polyfill; CORS still blocks the request.
- Passing `LangChainTracer` with callbacks to `graph.stream()` → tracer runs, but the outbound request to LangSmith fails (CORS).
- Setting `VITE_LANGCHAIN_TRACING_V2`, `VITE_LANGCHAIN_API_KEY`, etc. in `.env` → keys are exposed in the bundle and requests are still blocked.

**Bottom line**: Browser-based tracing only works with a backend proxy or token exchange. The proxy pattern (like `openrouter-proxy`) is the right approach.

### Fix: Agent Not Responding and "No API key found" (Simple Explanation)

If the agent gets stuck on "Designing strategy..." and the console shows "No API key found in request," the LLM requests to the openrouter-proxy were being rejected. The proxy is a Supabase Edge Function; Supabase requires every request to include your project's public key (the `apikey` header). The LLM client was not sending it. We now add that key automatically when calling the proxy, so the agent can get AI responses again.

Separately, the LangSmith tracer was sending requests from the browser that returned 403 errors. We turned the tracer off in the browser so it no longer spams the console or interferes with the agent.

### Fix: Agent Not Responding and "No API key found" (Technical Explanation)

- **Cause**: `ChatOpenAI` calls `VITE_OPENROUTER_PROXY_URL` (a Supabase Edge Function) via direct `fetch()`. The Supabase Functions gateway expects the `apikey` header (anon/publishable key). Without it, the gateway returns `{"message":"No API key found in request","hint":"No \`apikey\` request header or url param was found."}` and the LLM never receives a response.
- **Fix**: In `src/agent/goalAgent.ts`, we build an `llmConfig` that adds `defaultHeaders: { apikey: supabaseKey }` when `VITE_OPENROUTER_PROXY_URL` is set. The Supabase key comes from `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`. All three LLM instances (main model, draft, critique) use this config.
- **LangSmith**: The `LangChainTracer` was disabled in `GoalWizard.tsx` because direct POSTs to `api.smith.langchain.com` from the browser return 403. Re-enable only when a LangSmith proxy is in place.

---

<a id="how-levels-and-credits-work"></a>
## How Levels and Credits Work

- **Where they live:** In the Supabase `profiles` table: `level` (integer, default 1), `credits` (integer, default 5), `points` (integer, default 0).
- **Level:** Gamification. Displayed on the Profile screen. **Implemented:** when a user saves a blueprint (signed in), they earn +10 points and level is computed as `floor(points / 100) + 1`; level-up toast and confetti are shown. Achievements and streak tracking (see `src/lib/gamification.ts`) also run on save.
- **Credits:** Limit AI usage per user. **Implemented:** GoalWizard checks credits before calling AI; when credits are zero it falls back to rule-based generation. On successful AI result (initial blueprint or refine), the app calls `decrement_credits` RPC. Profile page shows current credits.
- **Points:** Used for community (e.g. voting, gifting). Stored in `profiles.points` and can be awarded when others vote for your templates or when you gift points to authors. The Community screen uses this for “gift points” and display.

Summary: **Level** = progression / gamification; **Credits** = AI usage budget; **Points** = community reputation. All are stored in `profiles` and can be wired to real behavior in the app and/or Supabase functions.

---

<a id="architecture"></a>
## Architecture

### Frontend / Backend Split

Vector uses a **frontend-first** architecture with **Supabase Edge Functions** for backend logic:

| Layer | Where | What | Secrets |
|-------|-------|------|---------|
| **Frontend** | Vercel (React/Vite) | UI, routing, local state, calls backend APIs | Public keys only (`VITE_SUPABASE_URL`, `VITE_ANON_PUBLIC_KEY`, `VITE_MERCADOPAGO_PUBLIC_KEY`) |
| **Backend** | Supabase Edge Functions | AI proxy, payment processing, webhooks, credit management | Secret keys (`OPENROUTER_API_KEY`, `MERCADOPAGO_ACCESS_TOKEN`) in Supabase Secrets |
| **Database** | Supabase Postgres | Auth, profiles (tier, credits), blueprints, templates, votes, payments, analytics_events | RLS policies enforce security |

**Edge Functions:**
- **openrouter-proxy** — Proxies Open Router API; keeps AI key server-side. Frontend calls this instead of Open Router directly.
- **mercado-pago-preference** — Creates MercadoPago payment preference; returns `init_point` URL for checkout redirect.
- **mercado-pago-webhook** — Receives payment notifications from MercadoPago; updates `profiles.credits` and `profiles.tier` using `increment_credits` RPC; calls **send-email** for receipt.
- **send-email** — Sends transactional emails (receipt, etc.). Called by mercado-pago-webhook. Requires `RESEND_API_KEY` (or equivalent) in Supabase Secrets.
- **handle-new-user** — Triggered by Database Webhook (INSERT on `auth.users`). Sends welcome email via Resend. Requires `RESEND_API_KEY` and webhook configured in Supabase Dashboard.

**Payment Flow (MercadoPago):**
1. User clicks "Get Standard" or "Get Max" on Pricing page.
2. Frontend calls `mercado-pago-preference` Edge Function with tier/amount.
3. Edge Function creates preference using `MERCADOPAGO_ACCESS_TOKEN` and returns `init_point`.
4. Frontend redirects user to MercadoPago Checkout (`init_point`).
5. User completes payment; MercadoPago sends webhook to `mercado-pago-webhook`.
6. Webhook verifies payment, determines tier/credits from amount, updates `profiles` table.

**Tier Enforcement:**
- User tier is stored in `profiles.tier` (architect/standard/max/enterprise).
- `src/lib/tiers.ts` defines tier config (credits, allowed frameworks, export permissions).
- Frontend fetches tier on auth and uses `canUseFramework(tier, frameworkId)` to lock/unlock frameworks.
- GoalWizard disables Calendar/PDF export buttons based on `canExportCalendar(tier)` and `canExportPdf(tier)`.

---

### Component Architecture

- **Entry:** `index.html` loads the app; `src/main.tsx` mounts React and wraps the tree in **HelmetProvider**, **BrowserRouter**, **ThemeProvider** (light/dark), **LanguageProvider** (i18n), **ErrorBoundary**, and **App**. Also injects Vercel Speed Insights and Vercel Analytics.
- **Routing:** React Router with Routes and Route. Routes: /, /wizard, /dashboard, /community, /pricing, /profile, /frameworks/:id, /analytics, /admin. Navigation uses navigate(path). The current “screen” is React state in `App.tsx`: `useLocation().pathname`.
- **App as controller:** `App.tsx` holds: user (Supabase auth: `userId`, `userEmail`), blueprints list, onboarding visibility, selected framework, tier, and (optionally) which blueprint is open. It renders: global nav, footer, particle background, and the main content area via React Router. Handlers for save, delete, sign-in, waitlist, pricing CTA, and “start wizard” live here.
- **Data flow:** Blueprints are kept in memory and persisted to `localStorage` and (when signed in) to Supabase `blueprints`. Profiles, community templates, votes, waitlist, and payments go to Supabase only. Auth state is subscribed via `supabase.auth.onAuthStateChange`.
- **Goal Wizard:** Receives selected framework and optional initial blueprint. Uses `frameworkConfig` (questions + rule-based `generateResult`). On “done,” it tries Open Router first; on failure or missing key, uses `generateResult(answers)`. Result is shown; user can save, export (calendar/ICS), or restart.
- **i18n:** `LanguageProvider` + `translations.ts` + `t(key)` in components. No routing by locale; language is global state.
- **Styling:** Tailwind + `theme.css` (CSS variables for light/dark). Components use Tailwind classes and shadcn/ui building blocks.

---

<a id="tech-stack"></a>
## Tech Stack

| Layer | Technology | Role |
|-------|------------|------|
| **Runtime / build** | Node, Vite 6 | Dev server, bundling, HMR. |
| **Language** | TypeScript | Typing, refactors, fewer runtime errors. |
| **UI** | React 18 | Components, state, single-page screen switching. |
| **Styling** | Tailwind CSS 4, PostCSS | Utility-first CSS, theme variables. |
| **Motion** | Motion (framer-motion fork) | Animations, AnimatePresence for screen transitions. |
| **Backend / auth / DB** | Supabase | Auth (magic link), Postgres (blueprints, profiles, community_templates, template_votes, waitlist), RLS. |
| **AI** | Open Router | LLM API (e.g. GPT-4o-mini) to turn answers into blueprint JSON. |
| **UI primitives** | Radix UI (via shadcn/ui) | Dialogs, dropdowns, buttons, inputs, toasts, etc. |
| **Icons** | Lucide React | Icons across the app. |
| **Toasts** | Sonner | Toast notifications. |
| **Theme** | next-themes | Light/dark persistence and provider. |
| **Calendar export** | Google Identity Services + ICS | Sign-in for Google Calendar; fallback: download .ics file. |

Other deps: `canvas-confetti`, `date-fns`, `react-hook-form`, `recharts`, `@vercel/analytics`, `@vercel/speed-insights`, `vite-plugin-sitemap`, `vite-plugin-pwa` (PWA configured in vite.config), etc. See `package.json` for versions.

---

<a id="architectural-decisions"></a>
## AI Architecture & Tech Stack Decisions

We explicitly chose **Vite** (SPA) over Next.js and considered different AI agent architectures. Here is the rationale.

### Why Vite instead of Next.js?

1.  **Client-Heavy Logic**: Vector is primarily a "local-first" tool. Blueprint drafting, drag-and-drop, and state management happen in the browser. Next.js adds server-side rendering (SSR) complexity that isn't strictly necessary for an app behind an auth wall.
2.  **Deployment Simplicity**: A Vite app builds to static HTML/JS/CSS. It can be hosted anywhere (Vercel, Netlify, S3, Supabase Storage) without needing a Node.js runtime. This reduces ops overhead and cost.
3.  **Supabase Integration**: Since we use Supabase for Auth and DB, we don't need the Next.js API routes for backend logic. Supabase Edge Functions provide a cleaner separation of concerns.

### AI Architecture: Current vs. LangGraph

We are transitioning from a stateless model to a stateful agent. Here is the trade-off analysis:

| Architecture | Description | Pros | Cons |
|--------------|-------------|------|------|
| **Current (Stateless)** | `GoalWizard` sends all answers to LLM in one shot. | • **Fast**: Single request.<br>• **Simple**: No state management.<br>• **Cheap**: Minimum token usage. | • **"Dumb"**: Can't plan or critique itself.<br>• **Rigid**: If data is missing, it guesses instead of asking.<br>• **No Memory**: Can't remember past corrections easily. |
| **LangGraph JS (Client)** | Agent graph runs in the browser (`@langchain/langgraph`). | • **Stateful**: Can loop (Plan → Critique → Improve).<br>• **No Backend**: Runs on user's device.<br>• **Responsive**: Real-time updates without server roundtrips. | • **Complexity**: Managing graph state in React.<br>• **Security**: Prompts exist in client bundle (ok for public prompts).<br>• **Heavier Bundle**: Adds ~200kb of JS. |
| **LangGraph Python (Server)** | Agent runs on a Python server (FastAPI/Flask). | • **Powerful**: Access to Python ecosystem (Pandas, NumPy).<br>• **Secure**: Prompts/Logic hidden on server.<br>• **Persistent**: Easier to persist long-term agent state in DB. | • **Cost**: Requires hosting a Python service (e.g. Railway/AWS).<br>• **Latency**: Network hops for every step.<br>• **Overkill**: We don't need complex data processing yet. |

**Decision**: We are moving to **LangGraph JS (Client-side)**. This gives us the "smart" agentic behaviors (planning, critique, multi-turn) without the overhead of maintaining a separate Python backend service.

### Where the AI Agent Runs (and Where It Doesn’t)

**The AI agent runs in your browser** (on your computer or phone). When you chat in the Goal Wizard, the “brain” that decides what questions to ask, when to generate a blueprint, and how to refine it—all of that logic runs right in the web page. Nothing about that flow is running on our servers.

**So what do the Supabase functions do?** They are helper services on the server. They do *not* run the agent. Instead:

- **openrouter-proxy** — When the agent needs an AI reply, it asks this function to get one. The function keeps our API key secret and forwards the request to Open Router. Think of it as a safe middleman: your browser says “I need an answer,” the function fetches it and sends it back.
- **mercado-pago-preference**, **mercado-pago-webhook** — Payment setup and handling (checkout, credits, receipts).
- **send-email**, **handle-new-user** — Emails (receipts, welcome messages).

In short: the agent’s logic lives in the browser; the server provides secure access to the AI and handles payments and emails.

---

<a id="efficiency-advantages-and-disadvantages"></a>
## Efficiency, Advantages and Disadvantages

### Efficiency

- **Bundle:** Vite tree-shakes and code-splits; the app is a single SPA, so the main bundle includes all screens. For very large apps, lazy-loading screens (e.g. `React.lazy` for Dashboard, Community) would reduce initial load.
- **Network:** Supabase and Open Router are called only when needed (auth, load/save blueprints, AI, community). No polling; updates are on user action.
- **Rendering:** React state updates are localized; list UIs (blueprints, templates) are small. No virtual scrolling yet; fine for dozens of items, not thousands.

### Advantages

- **Single codebase:** One app for web; i18n and theme cover language and accessibility.
- **Offline-first feel:** Blueprints are cached in `localStorage`, so the app works without sign-in and survives brief network failures for already-loaded data.
- **AI optional:** No Open Router key → rule-based blueprints; the product still works.
- **Supabase:** Quick auth and Postgres with RLS; little backend code to maintain.
- **Rich UI:** Radix/shadcn, Motion, and Tailwind allow consistent, accessible, animated interfaces.

### Disadvantages

- **API key exposure:** Open Router (and optionally Google) keys in the frontend are visible; production should use a backend proxy for AI and sensitive ops.
- **No server-side logic:** Level/credit deduction, rate limits, and complex rules require Supabase functions or another backend if you want them enforced securely.
- **SPA limitations:** No URL per screen (e.g. `/dashboard`), so deep-linking and back button don’t reflect “pages”; SEO is limited to the single index page.
- **Scale:** Large lists (e.g. hundreds of blueprints or templates) would benefit from pagination, virtual scrolling, and indexed Supabase queries.

---

<a id="what-can-be-improved"></a>
## What Can Be Improved

### Already implemented

- **TOC deep links:** Use explicit anchor IDs (as in this README) so “Table of Contents” links work in every viewer.
- **Levels and credits:** Level and points are updated when saving blueprints; Goal Wizard checks credits and calls `decrement_credits` when AI is used (RPC must exist in Supabase).
- **Routing:** React Router is in place; routes include `/`, `/dashboard`, `/community`, `/pricing`, `/profile`, `/wizard`, `/frameworks/:id`, `/analytics`, `/admin`.
- **Offline / retry:** Offline banner and retry helper with exponential backoff for Supabase auth and blueprint sync.
- **Framework detail modal:** “Learn more“ on framework cards opens FrameworkDetail with author, pros, cons, example.
- **Publish template:** “Publish as template” from Dashboard inserts into community_templates.
- **Performance:** GoalWizard, Pricing, Dashboard, Community, Profile, AdminDashboard are lazy-loaded with React.lazy and Suspense.
- **Nav active state, footer alignment, Community fetch:** Current-route highlighting, footer/Share alignment, Community loading from Supabase.
- **Pricing structure:** Four tiers (Architect / Standard / Max / Enterprise) with shared config in `src/lib/tiers.ts`. Standard (15 credits, all frameworks) and Max (40 credits, calendar/PDF, priority AI) use **one-time** pricing; MercadoPago checkout is wired for both when configured.
- **Tier enforcement:** Framework cards show locked state for frameworks not in user's tier; GoalWizard checks `canUseFramework(tier, framework)` and disables Calendar/PDF export buttons based on `canExportCalendar` / `canExportPdf` for the user's tier. User tier is fetched from `profiles.tier` on auth.
- **Credits & tier RPC:** GoalWizard calls `decrement_credits` when AI is used; webhook uses `increment_credits`. Ensure these RPCs and `profiles.tier` exist in your Supabase project (e.g. via migrations or SQL).
- **MercadoPago webhook:** `supabase/functions/mercado-pago-webhook/index.ts` handles payment notifications, updates `profiles.credits` and `profiles.tier` using `increment_credits` RPC and tier amounts from `TIER_CONFIGS`.
- **PDF export:** `src/lib/pdfExport.ts` exports blueprints to PDF (Max tier feature); GoalWizard shows locked PDF button for lower tiers.
- **SEO:** Meta and Open Graph in `index.html`; per-framework pages at `/frameworks/:id` use `react-helmet-async` for title/description/OG.
- **Admin dashboard:** Route `/admin` for users with `profiles.is_admin`; `AdminDashboard`; RLS in `supabase/migrations/20260131_admin_updates.sql`.
- **User analytics page:** Route `/analytics`; `AnalyticsPage` and `analytics_events` table; `trackEvent` in `src/lib/analytics.ts`.
- **Help Me Choose (AI-suggested framework):** `HelpMeChooseModal`; `suggestFramework` in `openrouter.ts`; prompt `prompts/suggest-framework.txt`.
- **Blueprint refinement:** GoalWizard refine flow; `refineBlueprint` in `openrouter.ts`; `decrement_credits`; `blueprint_messages` table (migration `20260131_chat_history.sql`).
- **Achievements and streaks:** `src/lib/gamification.ts`; milestones and streak; `AchievementsList` on Profile.
- **Bulk export:** `BulkExportModal` in Dashboard; tier-gated (Max); branding from profile.
- **Framework SEO pages:** `/frameworks/:id` with `FrameworkPage` and `frameworkContent.ts`; Helmet for title, description, og:title, og:description, keywords per framework.
- **Vercel Speed Insights:** `injectSpeedInsights()` in `main.tsx`.
- **Dashboard pagination:** Remote blueprints loaded in pages via `loadRemoteBlueprints(uid, page)` with `.range(from, to)`; "Load More" button and `hasMore` / `isLoadingMore` in `Dashboard.tsx`.
- **Community pagination:** Templates loaded in pages via `fetchTemplates(pageToLoad)` with `.range(from, to)`; "Load More" button and `hasMore` / `isLoadingMore` in `Community.tsx`; sort by recent/top.
- **Leaderboard:** Community leaderboard showing top contributors by total votes; `get_leaderboard` RPC; `Leaderboard.tsx` component.
- **Gamification:**
    - **Levels & XP:** Earn points by saving blueprints; level up as you grow.
    - **Streaks:** Maintain a daily streak by being active.
    - **Achievements:** Unlock badges (e.g., "First Steps", "Architect", "Dedicated") for reaching milestones.


### Suggested improvements

- **Expand test coverage:** Add unit tests (Vitest) for `openrouter`, `blueprints`, `calendarExport`, `pdfExport`, `gamification`; integration tests for `GoalWizard` and `Dashboard`. (`src/lib/tiers.test.ts` exists as a starting example.)
- **Virtual scrolling (optional):** For very large lists (hundreds of items), consider virtual scrolling; pagination is already implemented for Dashboard and Community.
- **Email notifications:** Receipt email on purchase is implemented (webhook → send-email). Optional: low-credits reminder, welcome email.
- **Admin analytics:** Admin dashboard could show aggregate usage (tier conversions, payments, framework usage) beyond per-user data.
- **Collaborative blueprints:** Allow users to share blueprints with others for real-time collaboration (requires WebSockets or Supabase Realtime).
- **Mobile app:** Build React Native or PWA version for iOS/Android with offline-first sync.
- **Advanced AI features:** Multi-turn conversations in Goal Wizard (follow-up questions based on answers). (AI-suggested framework and blueprint refinement are already implemented.)
- **Gamification:** Leaderboard is implemented. Further: weekly challenges, team leaderboards. (Achievements, streaks, and community leaderboard are already implemented.)
- **Export enhancements:** Export to Notion, Trello, Asana, or other project management tools; bulk calendar export; custom PDF branding (Max tier branding from profile is already used in bulk PDF export).
- **Subscription model:** Convert one-time pricing to recurring subscriptions (monthly/yearly) for sustained revenue. Requires Stripe or MercadoPago subscriptions API.
- **Admin enhancements:** Approve/reject/feature community templates from Admin UI; bulk user/tier management.
- **Internationalization expansion:** Add more languages (French, German, Portuguese) to `translations.ts`.
- **SEO improvements:** Per-framework pages and meta are already in place. Optional: link framework cards or "Learn more" to `/frameworks/:id` from the landing page for discoverability; implement SSR or prerendering for better indexing.

**Stripe (future, US):** See [integrations/pending/stripe/](integrations/pending/stripe/).

### Previously identified gaps — now addressed

The following gaps have been fixed in the codebase:

| Gap | Status | Implementation |
|-----|--------|----------------|
| Profile when logged out | Fixed | `/profile` shows "Sign in required" + Sign in button (App.tsx Route, lines 749–760) |
| Post-payment experience | Fixed | `?payment=success` on return: toast + profile refetch; `back_url_success` → `/dashboard?payment=success` (App.tsx, mercadoPago.ts) |
| Anonymous → signed-in merge | Fixed | `syncLocalBlueprintsToRemote` on sign-in; local blueprints uploaded, toast shows count (App.tsx, blueprints.ts) |
| Offline delete queue | Fixed | `queueDeletedBlueprint` when offline; `processDeletedQueue` on sign-in (App.tsx handleDeleteBlueprint, blueprints.ts) |
| Locked framework click | Fixed | Toast + Pricing CTA on click; wizard does not open (App.tsx FrameworkCard onClick) |
| Wizard tier check (deep link) | Fixed | GoalWizard `useEffect`: if `!canUseFramework` → toast + `onBack()` (GoalWizard.tsx lines 43–48) |
| Email after purchase | Fixed | mercado-pago-webhook calls send-email Edge Function with receipt (mercado-pago-webhook/index.ts lines 174–201) |
| Analytics nav entry | Fixed | Analytics link in nav (desktop + mobile); route `/analytics` (App.tsx) |
| handle-new-user webhook | Fixed | Checks `body.schema === 'auth'` and `body.table === 'users'` for Supabase auth payload (handle-new-user/index.ts) |
| PWA | Fixed | VitePWA configured in `vite.config.ts` with manifest, icons, autoUpdate |
| verify_webhook.js | Fixed | Uses `process.env.VITE_SUPABASE_URL` or `process.env.PROJECT_ID`; no hardcoded project ID |
| Base tables migration | Fixed | `20240101000000_baseline_schema.sql` creates profiles, blueprints, community_templates, template_votes |
| Template moderation (Admin) | Fixed | AdminDashboard has approve/reject/feature actions for community templates (`handleUpdateTemplate`) |

---

<a id="project-structure-where-everything-lives"></a>
## Project Structure: Where Everything Lives

Think of the project as a small number of places where “the app” and “the content” live.

```
Vector/
├── index.html                    # The single HTML page; <title>, SEO meta, Open Graph
├── package.json                  # List of dependencies and scripts (e.g. npm run dev)
├── .env                          # Frontend keys (Supabase URL/anon key, MercadoPago Public Key, etc.). Safe to commit placeholders.
├── .env.backend (optional)       # Backend-only vars; never commit. See env docs for Supabase Secrets.
├── supabase/migrations/         # Database: run in order (see "How to Run" section); ensure base tables + credit RPCs exist
├── scripts/
│   ├── prerender.js             # Prerenders routes for SEO (puppeteer)
│   └── verify_webhook.js        # Tests MercadoPago webhook endpoint
│
├── src/
│   ├── main.tsx                  # Entry: HelmetProvider, BrowserRouter, ThemeProvider, LanguageProvider, ErrorBoundary, App; Vercel Speed Insights + Analytics
│   ├── styles/                   # Global CSS (Tailwind, theme variables, fonts)
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   └── theme.css
│   │
│   ├── app/
│   │   ├── App.tsx               # ★ Main controller: current screen, nav, frameworks list, all handlers
│   │   └── components/          # All UI building blocks
│   │       ├── OnboardingModal.tsx   # First-time welcome + steps
│   │       ├── FrameworkCard.tsx    # One framework tile (title, description, “Learn more”)
│   │       ├── FrameworkDetail.tsx   # Modal: full framework info (author, pros, cons, example)
│   │       ├── GoalWizard.tsx        # Chat flow + result view + save/export + refine
│   │       ├── Dashboard.tsx         # My Blueprints list + delete + bulk export
│   │       ├── Profile.tsx           # Profile form + level + credits + achievements + streak
│   │       ├── Community.tsx         # Templates list + vote + use + gift
│   │       ├── PricingSection.tsx    # Four pricing tiers (Architect, Standard, Max, Enterprise)
│   │       ├── HelpMeChooseModal.tsx # AI-suggested framework from goal description
│   │       ├── BulkExportModal.tsx   # Multi-blueprint PDF export (Max tier)
│   │       ├── AdminDashboard.tsx    # Admin: users, templates, analytics, payments (route /admin)
│   │       ├── admin/AdminAnalytics.tsx  # Admin analytics tab
│   │       ├── admin/AdminPayments.tsx   # Admin payments tab (payments table)
│   │       ├── admin/UserDetailModal.tsx # Admin user detail modal
│   │       ├── AchievementsList.tsx  # Profile achievements display
│   │       ├── Leaderboard.tsx       # Community leaderboard (top contributors)
│   │       ├── InspirationalQuote.tsx # Rotating quote bubble on landing
│   │       ├── ShareButton.tsx       # Share / copy link in footer
│   │       ├── AuthModal.tsx         # Sign in with email (magic link)
│   │       ├── ParticleBackground.tsx # Animated dots reacting to mouse
│   │       ├── ErrorBoundary.tsx     # Catches crashes and shows “Refresh” message
│   │       ├── language-provider.tsx # Provides current language and t(key)
│   │       ├── language-toggle.tsx   # EN / ES (or more) switcher
│   │       ├── theme-toggle.tsx     # Light / dark switcher
│   │       └── ui/                    # Reusable UI (buttons, dialogs, inputs, etc.)
│   │
│   ├── pages/
│   │   ├── FrameworkPage.tsx     # Per-framework SEO page at /frameworks/:id (Helmet meta)
│   │   └── AnalyticsPage.tsx    # User analytics at /analytics (framework usage, activity)
│   └── lib/                      # Non-UI logic: API clients, data, translations
│       ├── supabase.ts           # Supabase client (auth + DB)
│       ├── openrouter.ts         # AI: generateBlueprintResultAI, suggestFramework, refineBlueprint
│       ├── blueprints.ts         # Blueprint type, local load/save (localStorage)
│       ├── frameworks.ts         # Framework list (id, title, description, author, pros, cons, example)
│       ├── frameworkContent.ts   # Extended content for FrameworkPage (longDescription, history, steps)
│       ├── leaderboard.ts        # fetchLeaderboard; get_leaderboard RPC
│       ├── tiers.ts              # Tier config: credits, frameworks, features (Architect/Standard/Max/Enterprise)
│       ├── calendarExport.ts     # Turn blueprint into events; Google Calendar or .ics
│       ├── pdfExport.ts          # Blueprint to PDF; branding from profile
│       ├── mercadoPago.ts        # MercadoPago checkout (calls Edge Function, redirects)
│       ├── gamification.ts       # Achievements, streaks; checkAndAwardAchievements
│       ├── analytics.ts          # trackEvent; analytics_events table
│       ├── translations.ts       # All copy: en + es (and keys for t(key))
│       └── prompts/               # AI prompts (e.g. suggest-framework.txt, refine-blueprint.txt)
```

- **Content and copy**  
  - Framework **names and descriptions** on cards: `src/lib/frameworks.ts` (imported in App); translations via `t('fw.<id>.title')`, `t('fw.<id>.desc')`.  
  - **All other user-facing text** (nav, buttons, wizard, profile, community, etc.): `src/lib/translations.ts` under keys like `nav.frameworks`, `onboarding.welcome.title`, `quote.1.text`, etc.  
- **Screens / routes**  
  - Routes: `/`, `/wizard`, `/dashboard`, `/community`, `/pricing`, `/profile`, `/frameworks/:id`, `/analytics`, `/admin`. Nav uses `navigate(path)`; current route from `useLocation().pathname`.
- **Data**  
  - Blueprints: in memory in `App.tsx`, persisted to `localStorage` and (when signed in) to Supabase `blueprints` table.  
  - Profile: Supabase `profiles` table.  
  - Community: Supabase `community_templates` and `template_votes` tables.

---

<a id="how-everything-is-connected"></a>
## How Everything Is Connected

- **Start**  
  `index.html` loads `src/main.tsx`.  
  `main.tsx` wraps the app in:
  - **ThemeProvider** (light/dark)
  - **LanguageProvider** (language + `t(key)` for translations)
  - **ErrorBoundary** (so a crash shows a message instead of a blank page)
  - **App**

- **App.tsx**  
  - Holds: current **screen**, **user** (id + email from Supabase auth), **blueprints** list, **onboarding** show/hide, and which framework is selected.  
  - Renders: nav, footer, particle background, and one main area that switches by screen (landing, wizard, pricing, dashboard, profile, community).  
  - When you click “Frameworks” or a framework card, it either changes the screen (landing) or calls `handleStartWizard(frameworkId)`, which sets the selected framework and switches to the wizard screen.  
  - Saving a blueprint updates local state and (if signed in) Supabase.  
  - Profile and Community read/write Supabase (profiles, community_templates, template_votes).

- **Goal Wizard**  
  - Gets the chosen **framework** and (optionally) an existing blueprint to reopen.  
  - Uses **translations** for questions and labels via `t(...)`.  
  - When you finish the questions, it calls **Open Router** (if configured) to get a structured result; otherwise it uses a simple **rule-based** result.  
  - Save/export use the same blueprint data; export uses **calendarExport** (Google or .ics).

- **Translations**  
  - `translations.ts` exports an object `{ en: { ... }, es: { ... } }`.  
  - `LanguageProvider` stores the current language and exposes `t(key)`.  
  - Components use `t('nav.frameworks')`, `t('fw.pareto.title')`, etc. Changing or adding text is done in `translations.ts` and in `frameworks.ts` (or `frameworkContent.ts`) for framework card/detail content.

- **Database**  
  - Supabase stores: users (auth), blueprints (per user), profiles (display name, bio, avatar, level, credits), community_templates, template_votes, waitlist.  
  - RLS (row-level security) ensures users only see/edit their own data where intended; templates and votes are readable by everyone, writable by authenticated users under the rules in the SQL files.

---

<a id="how-to-change-or-add-things"></a>
## How to Change or Add Things

These steps are written so a non-developer can follow the map; a developer can do the actual edits.

### Add the Desktop Recommendation Banner to another framework view

Some framework result views (Mandala, Eisenhower, Ikigai, Pareto) show a banner on mobile: *"This visualization works best on desktop. Your plan is saved—open it on a laptop or desktop to explore the full view."* To add this to another view:

1. **Import the shared components:**
   ```tsx
   import { useIsMobile } from '../ui/use-mobile';
   import { DesktopRecommendedBanner } from './DesktopRecommendedBanner';
   ```

2. **Call the hook** inside your view component:
   ```tsx
   const isMobile = useIsMobile();
   ```

3. **Render the banner** at the top of the view when `isMobile` is true:
   ```tsx
   {isMobile && <DesktopRecommendedBanner className="mb-6" />}
   ```

4. **Optional custom message:** The banner uses the generic translation `wizard.visualizationDesktopRecommended`. To use a framework-specific message (e.g. Mandala), pass `message={t('mandala.desktopRecommended')}` and add the key in `translations.ts`.

**Files:** `src/app/components/wizard/DesktopRecommendedBanner.tsx`, `src/lib/translations.ts` (key: `wizard.visualizationDesktopRecommended`).

---

### Add or edit a framework

- **Where:** `src/lib/frameworks.ts` — the `frameworks` array is defined there and imported in `App.tsx`.  
- **What:** Each item has: `id`, `title`, `description`, `icon`, `color`, and (for the detail modal) `author`, `definition`, `pros` (array of strings), `cons` (array of strings), `example`.  
- **Add:** Copy an existing block, change `id` (e.g. `'new-framework'`), and fill in title, description, author, definition, pros, cons, example.  
- **“Learn more” / framework detail modal:** Each framework card can open a detail view (author, definition, pros, cons, example). The modal is implemented in `FrameworkDetail.tsx`. To wire it in `App.tsx`: add state like `const [viewingFramework, setViewingFramework] = useState<typeof frameworks[0] | null>(null)`, pass `onLearnMore={() => setViewingFramework(fw)}` to each `FrameworkCard`, and render `{viewingFramework && <FrameworkDetail framework={viewingFramework} onClose={() => setViewingFramework(null)} onStart={() => { setViewingFramework(null); handleStartWizard(viewingFramework.id); }} />}`.  
- **Wizard:** To make the new framework usable in the Goal Wizard, you must also add it in `src/app/components/GoalWizard.tsx`: in `frameworkConfig` add the same `id` with `title`, `questions` array, and `generateResult(answers)` that returns the right shape.  
- **Types:** In `src/lib/blueprints.ts` the type `FrameworkId` lists allowed framework ids; add your new id there too.  
- **Translations:** For card title/description, add keys like `fw.new-framework.title` and `fw.new-framework.desc` in `src/lib/translations.ts` (in both `en` and `es`). For wizard title and questions, use keys like `fp.title` / `fp.q1` or the equivalent for your framework and reference them in GoalWizard.

### Add a new language

- **Where:** `src/lib/translations.ts`.  
- **What:** The file has one big object: `translations = { en: { ... }, es: { ... } }`.  
- **Add:** Duplicate the `es` block (or `en`), name it e.g. `fr` for French, and translate every value. Then add the new language to `SUPPORTED_LANGUAGES` at the bottom (e.g. `{ code: 'fr', label: 'Français' }`).  
- **Where it’s used:** `LanguageToggle` uses `SUPPORTED_LANGUAGES` to show options; `LanguageProvider` and `t(key)` will use the new code once it’s in the object.

### Change or add copy (buttons, labels, messages)

- **Where:** `src/lib/translations.ts`.  
- **What:** Find the key (e.g. `nav.community`, `onboarding.welcome.title`, `share.button`). Change the string for each language you support.  
- **New key:** Add a new key in both `en` and `es` (and any other language), e.g. `'section.newTitle': 'My New Section'`. Then in the component, use `t('section.newTitle')`.

### Add or edit inspirational quotes

- **Where:** `src/lib/translations.ts`.  
- **What:** Keys `quote.1.text`, `quote.1.author`, `quote.2.text`, … `quote.6.author`.  
- **Add:** Add `quote.7.text` and `quote.7.author` (and so on) in each language.  
- **Where it’s used:** `InspirationalQuote.tsx` cycles through quotes 1–6 by default; if you add more, adjust the array (e.g. `[1,2,3,4,5,6,7]`) in that component.

### Add a new section or screen

- **Where:** `src/app/App.tsx`.  
- **What:**  
  1. Add a new value to the `Screen` type (e.g. `'blog'`).  
  2. Add state if needed (e.g. which blog post is open).  
  3. In the nav (desktop and mobile menu), add a button that calls `navTo('blog')`.  
  4. In the main content area (the big `AnimatePresence` block), add a branch: `{screen === 'blog' && ( ... )}` and render your new section or a new component (e.g. `<Blog />`).  
- **New component:** Create e.g. `src/app/components/Blog.tsx`, import it in `App.tsx`, and render it when `screen === 'blog'`.

### Add or change community templates behavior

- **Data:** Templates are in Supabase table `community_templates`; votes in `template_votes`.  
- **Where:** `src/app/components/Community.tsx` loads templates, handles vote, use template, and gift.  
- **Publishing a template:** There must be a flow (e.g. from Dashboard: “Publish as template”) that inserts a row into `community_templates` with the current user and a snapshot of the blueprint (title, description, framework, answers, result). The Community page already reads from this table; you only need to implement the “Publish” UI and the insert.

### Change SEO or social preview

- **Where:** `index.html` (inside `<head>`).  
- **What:** Edit `<meta name="description">`, `<meta property="og:title">`, `og:description`, `og:url`, `og:image`, and the Twitter meta tags. Replace the URL and image path with your real site URL and image (e.g. `/og-image.jpg` in the project’s public folder).

### Change theme (colors, fonts)

- **Where:** `src/styles/theme.css` (CSS variables for light/dark).  
- **What:** Variables like `--background`, `--foreground`, `--primary` control colors. The rest of the app uses Tailwind classes that often map to these (e.g. `bg-background`, `text-foreground`). Change the variable values to change the look globally.

---

<a id="technical-summary-for-developers"></a>
## Technical Summary (For Developers)

- **Stack:** React 18, TypeScript, Vite, Tailwind CSS 4, Motion, Supabase (auth + Postgres), Open Router (LLM), Sonner (toasts), next-themes (theme), Lucide icons.  
- **Routing:** React Router; screens have routes (`/`, `/dashboard`, `/pricing`, `/profile`, `/community`, `/wizard`).
- **Data:** Blueprints in memory + `localStorage` + Supabase `blueprints`. Profiles, community_templates, template_votes, waitlist in Supabase. Tier config in `src/lib/tiers.ts`.
- **i18n:** Custom: `LanguageProvider` + `translations.ts` + `t(key)` in components.  
- **AI:** Open Router in `src/lib/openrouter.ts`; GoalWizard calls it after the last answer and falls back to rule-based `generateResult` on failure or missing key.  
- **Schema:** Run migrations in `supabase/migrations/`; ensure base tables and RPCs `decrement_credits` / `increment_credits` and `profiles.tier` exist.
- **Backend:** Supabase Edge Functions (openrouter-proxy, mercado-pago-preference, mercado-pago-webhook). Stripe is in **integrations/pending/stripe/** for future implementation.

---

<a id="attribution"></a>
## Attribution

This project uses components from [shadcn/ui](https://ui.shadcn.com/) (MIT) and may use assets from [Unsplash](https://unsplash.com). See `ATTRIBUTIONS.md` for details.
