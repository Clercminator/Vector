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
  - [Frameworks: List and Explanation](#frameworks-list-and-explanation)
    - [1. First Principles (Elon Musk)](#1-first-principles-elon-musk)
    - [2. Pareto Principle (80/20)](#2-pareto-principle-8020)
    - [3. Tony Robbins RPM (Rapid Planning Method)](#3-tony-robbins-rpm-rapid-planning-method)
    - [4. Eisenhower Matrix](#4-eisenhower-matrix)
    - [5. OKR (Objectives and Key Results)](#5-okr-objectives-and-key-results)
  - [How the AI Works](#how-the-ai-works)
  - [How Levels and Credits Work](#how-levels-and-credits-work)
  - [Architecture](#architecture)
  - [Tech Stack](#tech-stack)
  - [Efficiency, Advantages and Disadvantages](#efficiency-advantages-and-disadvantages)
    - [Efficiency](#efficiency)
    - [Advantages](#advantages)
    - [Disadvantages](#disadvantages)
  - [What Can Be Improved](#what-can-be-improved)
  - [Project Structure: Where Everything Lives](#project-structure-where-everything-lives)
  - [How Everything Is Connected](#how-everything-is-connected)
  - [How to Change or Add Things](#how-to-change-or-add-things)
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
  All blueprints you save appear here. You can open one to see the result again, export it, or delete it. Data is stored in your browser and, if you’re signed in, in the cloud (Supabase).

- **Profile**  
  When you’re signed in, you get a profile page: display name, bio, avatar image URL, level (gamification), and credits (used for AI-generated blueprints). You can edit your info and see how many credits you have left.

- **Community**  
  Users can publish blueprints as **templates**. On the Community page you see those templates, can **vote** on them, **use** one (import it into your blueprints), or **gift points** to the author.

- **Pricing**  
  Three tiers (Architect, Master Builder, Enterprise). Buttons take you to sign-in, waitlist, or contact, depending on the tier.

- **Languages & theme**  
  You can switch **language** (e.g. English / Español) and **theme** (light/dark) from the nav. All visible text and framework content can be translated.

- **Share**  
  A “Share” button in the footer uses your device’s share menu when available, or copies the app link to the clipboard.

- **Onboarding**  
  The first time you visit, a short onboarding modal appears: welcome, “choose a mental model,” and a tip (e.g. save blueprints, export to calendar). Completing or skipping it is remembered so it doesn’t show again.

- **SEO & social sharing**  
  The app’s HTML includes a short description and Open Graph / Twitter tags so links look good when shared on social media or in search results.

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
   Copy `.env.example` to `.env` (if it exists) or create a `.env` file in the **project root** with at least:
   - `VITE_SUPABASE_URL` — your Supabase project URL  
   - `VITE_ANON_PUBLIC_KEY` or `VITE_SUPABASE_ANON_KEY` — Supabase anon (public) key  
   Optional: `VITE_OPENROUTER_API_KEY` for AI; `VITE_GOOGLE_OAUTH_CLIENT_ID` for Google Calendar export.

3. **Start the app**  
   Run:  
   `npm run dev`  
   Open the URL shown (usually http://localhost:5173).

4. **Database**  
   In the Supabase dashboard, run the SQL in `supabase.sql` and `supabase_new_features.sql` so tables (blueprints, profiles, community_templates, template_votes, waitlist, etc.) and security (RLS) exist.

5. **Backend (payments, secure AI, credits/levels)**  
   The app is frontend-first. To add payment logic (Stripe), a secure AI proxy, and server-side credits/levels, see **[BACKEND.md](BACKEND.md)** for how to use Supabase Edge Functions and Vercel with Stripe and Open Router.

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

1. **When it runs:** After you answer the last question in the Goal Wizard, the app sends your answers to Open Router (model: `openai/gpt-4o-mini` by default).
2. **What is sent:** A **system prompt** (framework-specific) that describes the exact JSON shape (e.g. `truths`, `newApproach` for First Principles; `vital`, `trivial` for Pareto). The **user message** is: framework name + numbered list of your answers.
3. **What comes back:** The model is instructed to return **only** valid JSON. The app strips markdown code fences if present, parses the JSON, and validates it against the expected schema for that framework. If validation fails, the result is discarded.
4. **Fallback:** If `VITE_OPENROUTER_API_KEY` is missing, the request fails, or the response is invalid, the app uses a **rule-based** `generateResult` in `GoalWizard.tsx`: simple string splitting (commas, newlines) and mapping into the same blueprint shape. The wizard always produces a result; AI only improves structure and nuance.
5. **Security note:** The API key is read from the frontend env (`VITE_OPENROUTER_API_KEY`), so it is exposed in the client. For production, use a backend proxy that holds the key and calls Open Router server-side.

Relevant code: `src/lib/openrouter.ts` (API client, system prompts, JSON parsing/validation) and `src/app/components/GoalWizard.tsx` (calls `generateBlueprintResult`, then falls back to `currentConfig.generateResult(answers)`).

---

<a id="how-levels-and-credits-work"></a>
## How Levels and Credits Work

- **Where they live:** In the Supabase `profiles` table: `level` (integer, default 1), `credits` (integer, default 5), `points` (integer, default 0).
- **Level:** Gamification. Displayed on the Profile screen (e.g. “Level 1”). Intended to increase with activity (e.g. blueprints saved, templates published). The schema supports it; the exact “level up” rules (e.g. 5 blueprints = level 2) are not yet implemented in the app. You can extend Profile or backend logic to increment `level` when certain actions are completed.
- **Credits:** Intended to limit AI usage per user. Each AI-generated blueprint could consume one credit; when credits reach zero, the app could force the rule-based fallback. The UI shows “Credits” on the Profile page; deducting credits on each AI call is not yet implemented. To implement: before calling Open Router, check `profiles.credits > 0`; after a successful AI result, decrement `credits` in Supabase.
- **Points:** Used for community (e.g. voting, gifting). Stored in `profiles.points` and can be awarded when others vote for your templates or when you gift points to authors. The Community screen uses this for “gift points” and display.

Summary: **Level** = progression / gamification; **Credits** = AI usage budget; **Points** = community reputation. All are stored in `profiles` and can be wired to real behavior in the app and/or Supabase functions.

---

<a id="architecture"></a>
## Architecture

- **Entry:** `index.html` loads the app; `src/main.tsx` mounts React and wraps the tree in **ThemeProvider** (light/dark), **LanguageProvider** (i18n), **ErrorBoundary**, and **App**.
- **Single-page:** No React Router. The current “screen” is React state in `App.tsx`: `landing` | `wizard` | `pricing` | `dashboard` | `profile` | `community`. Navigation is `setScreen(...)` or `navTo(...)`.
- **App as controller:** `App.tsx` holds: screen, user (Supabase auth: `userId`, `userEmail`), blueprints list, onboarding visibility, selected framework, and (optionally) which blueprint is open. It renders: global nav, footer, particle background, and one main content area by screen. Handlers for save, delete, sign-in, waitlist, pricing CTA, and “start wizard” live here.
- **Data flow:** Blueprints are kept in memory and persisted to `localStorage` and (when signed in) to Supabase `blueprints`. Profiles, community templates, votes, and waitlist go to Supabase only. Auth state is subscribed via `supabase.auth.onAuthStateChange`.
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

Other deps: `canvas-confetti`, `date-fns`, `react-hook-form`, `recharts`, etc., for specific features. See `package.json` for versions.

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
- **Levels and credits:** Level and points are updated when saving blueprints; Goal Wizard checks credits and deducts when AI is used (Supabase RPC decrement_credits when available).
- **Routing:** React Router is in place; screens have URLs (`/`, `/dashboard`, `/community`, `/pricing`, `/profile`, `/wizard`).
- **Offline / retry:** Offline banner and retry helper with exponential backoff for Supabase auth and blueprint sync.
- **Framework detail modal (implemented):** Wire “Learn more” on framework cards to open `FrameworkDetail` with the selected framework (state in `App.tsx` + `onLearnMore` callback).
- **Publish template (implemented):** Add a “Publish as template” flow from Dashboard so users can publish a blueprint to `community_templates`.
- **Performance:** Heavy screens (Goal Wizard, Pricing, Dashboard, Community, Profile) are lazy-loaded with React.lazy and Suspense. Pagination/virtual lists for large data are not yet implemented.
- **Offline / retry, nav active state, footer alignment, Community fetch:** Offline banner and retry helper, current-route highlighting in the nav, footer link/Share alignment, and Community template loading from Supabase are implemented.
- **SEO:** Keep meta and Open Graph in `index.html`; if you add routing, consider prerendering or SSR for key landing routes.

### Not implemented / still to do

- **Payment logic:** The Pricing section is UI-only. There is no integration with a payment provider (e.g. Stripe, Paddle). Tier buttons trigger sign-in or waitlist/contact; no checkout, subscriptions, or entitlement checks. To support paid tiers, add a payment provider and optionally gate features (e.g. credits, frameworks) by subscription.
- **AI proxy:** Open Router is called from the client; the API key is in the frontend. For production, move calls to a backend (e.g. Supabase Edge Function or Node server) so the key is never exposed.
- **Tests:** No automated tests yet. Add unit tests (e.g. Vitest) for openrouter, blueprints, and calendarExport, and integration/component tests (e.g. React Testing Library) for GoalWizard and Dashboard.
- **Credits RPC:** Goal Wizard calls `supabase.rpc('decrement_credits', { user_id })`; this RPC must exist in Supabase. Add it in SQL if missing.
- **Pagination / virtual lists:** Large blueprint or template lists are not paginated or virtualized.

---

<a id="project-structure-where-everything-lives"></a>
## Project Structure: Where Everything Lives

Think of the project as a small number of places where “the app” and “the content” live.

```
Vector/
├── index.html                    # The single HTML page; <title>, SEO meta, Open Graph
├── package.json                  # List of dependencies and scripts (e.g. npm run dev)
├── .env                          # Your keys (Supabase, Open Router, Google). Not committed to git.
├── supabase.sql                  # Database: blueprints, waitlist, RLS
├── supabase_new_features.sql     # Database: profiles, community_templates, template_votes
│
├── src/
│   ├── main.tsx                  # Entry: wraps the app with Theme, Language, ErrorBoundary
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
│   │       ├── GoalWizard.tsx        # Chat flow + result view + save/export
│   │       ├── Dashboard.tsx         # My Blueprints list + delete
│   │       ├── Profile.tsx           # Profile form + level + credits
│   │       ├── Community.tsx        # Templates list + vote + use + gift
│   │       ├── PricingSection.tsx    # Three pricing tiers
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
│   └── lib/                      # Non-UI logic: API clients, data, translations
│       ├── supabase.ts           # Supabase client (auth + DB)
│       ├── openrouter.ts         # AI: generate blueprint from answers
│       ├── blueprints.ts         # Blueprint type, local load/save (localStorage)
│       ├── calendarExport.ts     # Turn blueprint into events; Google Calendar or .ics
│       └── translations.ts       # All copy: en + es (and keys for t(key))
```

- **Content and copy**  
  - Framework **names and descriptions** shown on cards: `App.tsx` (the `frameworks` array).  
  - **All other user-facing text** (nav, buttons, wizard, profile, community, etc.): `src/lib/translations.ts` under keys like `nav.frameworks`, `onboarding.welcome.title`, `quote.1.text`, etc.  
- **Screens**  
  - The “current screen” is one of: `landing` | `wizard` | `pricing` | `dashboard` | `profile` | `community`. It’s stored in `App.tsx` state; nav buttons and actions call `navTo('...')` or `setScreen('...')`.  
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
  - Components use `t('nav.frameworks')`, `t('fw.pareto.title')`, etc. So changing or adding text is done in `translations.ts` (and optionally in the `frameworks` array in `App.tsx` for card title/description).

- **Database**  
  - Supabase stores: users (auth), blueprints (per user), profiles (display name, bio, avatar, level, credits), community_templates, template_votes, waitlist.  
  - RLS (row-level security) ensures users only see/edit their own data where intended; templates and votes are readable by everyone, writable by authenticated users under the rules in the SQL files.

---

<a id="how-to-change-or-add-things"></a>
## How to Change or Add Things

These steps are written so a non-developer can follow the map; a developer can do the actual edits.

### Add or edit a framework

- **Where:** `src/app/App.tsx` — find the `frameworks` array (starts around line 26).  
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
- **Routing:** Single-page; screen state in `App.tsx` (`useState<Screen>`). No React Router.  
- **Data:** Blueprints in memory + `localStorage` + Supabase `blueprints`. Profiles, community_templates, template_votes, waitlist in Supabase.  
- **i18n:** Custom: `LanguageProvider` + `translations.ts` + `t(key)` in components.  
- **AI:** Open Router in `src/lib/openrouter.ts`; GoalWizard calls it after the last answer and falls back to rule-based `generateResult` on failure or missing key.  
- **Schema:** Run `supabase.sql` and `supabase_new_features.sql` in Supabase SQL editor for tables and RLS.
- **Backend:** See **BACKEND.md** for integrating Stripe, Supabase Edge Functions (e.g. Open Router proxy), and Vercel for payment logic, credits/levels, and secure AI.

---

<a id="attribution"></a>
## Attribution

This project uses components from [shadcn/ui](https://ui.shadcn.com/) (MIT) and may use assets from [Unsplash](https://unsplash.com). See `ATTRIBUTIONS.md` for details.
