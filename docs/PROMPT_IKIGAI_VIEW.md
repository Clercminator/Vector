# Prompt: Implement a Dedicated Ikigai View (Vector app)

## Context

You are working on **Vector**, a React (TypeScript) web app that turns user goals into structured plans using different “frameworks.” When the AI agent finishes a plan, the app shows a framework-specific result view in **`src/app/components/wizard/WizardResult.tsx`**, which branches on `result.type`.

**Mandala**, **Eisenhower**, and **Pareto** each have a **dedicated View component** with a distinctive, interactive UI:

- **`MandalaView.tsx`** – 9-cluster grid, central goal + 8 categories × 8 steps, zoom/pan, copy per cell and full chart, reorder.
- **`EisenhowerView.tsx`** – True 2×2 matrix (four quadrants), editable lists per quadrant, reorder within quadrant, copy per quadrant and full matrix.
- **`ParetoView.tsx`** – Vital few vs Trivial many (two columns), editable lists, reorder, copy per list and full.

**Ikigai** currently has **only an inline result** in `WizardResult.tsx`: a single page with a purpose block and a 2×2 grid of four editable cards, plus a “Copy Strategy” button. It does **not** have its own `IkigaiView.tsx` and does not match the visual and interaction quality of the three views above.

Your task is to **implement a dedicated Ikigai view** so that Ikigai has the **same level of UI final product** as Mandala, Eisenhower, and Pareto: a standalone, beautiful, interactive component with a clear layout, copy (per section + full), and a design that reflects the “four circles + center” Ikigai concept.

---

## 1. Current state

- **Location of inline Ikigai**: In `WizardResult.tsx`, the branch `result.type === 'ikigai'` renders ~60 lines of inline JSX: gradient bar, Copy Strategy button, purpose (EditableText), and four cards (love, goodAt, worldNeeds, paidFor) in a 2×2 grid.
- **Data shape** is already defined and used; the agent produces it; no backend changes needed.
- **Missing**: A dedicated **`IkigaiView.tsx`** component that:
  - Presents the Ikigai result in a **distinctive, memorable layout** (e.g. four “circles” or sections plus a clear center for purpose, or an equivalent visual metaphor).
  - Offers **copy per section** (e.g. copy “What you love”, “What you’re good at”, etc.) and a **“Copy full Ikigai” / “Copy Strategy”** action with user feedback (e.g. toast).
  - Is **editable** for all five fields (purpose, love, goodAt, worldNeeds, paidFor) and persists via `updateResult`.
  - Is **responsive**, supports **dark mode**, and follows the same patterns as EisenhowerView and ParetoView (structure, primitives, accessibility).

---

## 2. Data shape (Ikigai result)

```ts
{
  type: 'ikigai';
  love: string;       // What you love (passion)
  goodAt: string;    // What you're good at (profession)
  worldNeeds: string; // What the world needs (mission)
  paidFor: string;    // What you can be paid for (vocation)
  purpose: string;    // Your Ikigai — the intersection (center)
}
```

All five fields are **strings** (possibly multiline). There are no arrays; no reorder is required. Editing is done via `updateResult(['purpose'], val)`, `updateResult(['love'], val)`, etc.

**Existing translation keys** (use `t()` from `useLanguage()`):

- `ikigai.purpose` – “Your Ikigai (purpose)”
- `ikigai.love` – “What you love”
- `ikigai.goodAt` – “What you're good at”
- `ikigai.worldNeeds` – “What the world needs”
- `ikigai.paidFor` – “What you can be paid for”

These are already defined in `src/lib/translations.ts` (EN and at least one other locale).

---

## 3. Where it’s used

- **Create** `src/app/components/wizard/IkigaiView.tsx`.
- **In `WizardResult.tsx`**, when `result.type === 'ikigai'`, **replace** the current inline JSX (the entire `if (result.type === 'ikigai') { ... }` block) with:

  ```tsx
  if (result.type === 'ikigai') {
    return (
      <Wrapper>
        <IkigaiView result={result} updateResult={updateResult} />
      </Wrapper>
    );
  }
  ```

- **Props** for `IkigaiView`: `result` (Ikigai result type), `updateResult(path: (string | number)[], value: any)`.

---

## 4. Behaviour and design requirements

### 4.1 Layout and concept

- **Visual metaphor**: The Ikigai model is “four overlapping circles” with the intersection as purpose. The UI should reflect this conceptually:
  - Either a **literal** representation (e.g. four distinct sections/cards arranged around a central “Purpose” block, or a diagram-like layout with a clear center),
  - Or a **clear hierarchy**: purpose prominently in the center (or at the top as the “answer”), with the four supporting elements (love, goodAt, worldNeeds, paidFor) clearly labeled and laid out (e.g. 2×2 grid, or four cards in a row, or two rows of two).
- **Purpose** must be visually dominant (the “center” or “result” of the diagram). The four inputs can be equally weighted but distinct (e.g. four cards with icons or labels: Love, Good at, World needs, Paid for).
- **Responsive**: On small screens, stack or reflow so the layout remains readable and usable. Support **dark mode** if the app uses it (match existing views).

### 4.2 Editing

- **Every field** (purpose, love, goodAt, worldNeeds, paidFor) must be **editable in place** using the app’s existing primitives (e.g. **`EditableText`** from `src/app/components/Editable.tsx`). Multiline where appropriate.
- **Persistence**: All edits go through **`updateResult(path, value)`**:
  - `updateResult(['purpose'], val)`
  - `updateResult(['love'], val)`
  - `updateResult(['goodAt'], val)`
  - `updateResult(['worldNeeds'], val)`
  - `updateResult(['paidFor'], val)`
- No arrays, so no reorder; focus is on layout, copy, and polish.

### 4.3 Copy

- **Per-section copy**: The user must be able to copy each of the five parts (purpose, love, goodAt, worldNeeds, paidFor) separately. Options:
  - A small “Copy” control (icon button) on each section/card that copies that section’s text to the clipboard, with brief feedback (e.g. toast “Copied”).
  - Or a shared pattern used in other views (e.g. EisenhowerView has copy per quadrant).
- **“Copy full Ikigai” / “Copy Strategy”**: One clear action that copies the **entire** Ikigai to the clipboard in a readable format (e.g. markdown or plain text: purpose first, then the four sections with labels). After copy, show feedback (e.g. `toast.success('Copied to clipboard')` or similar).
- Use `navigator.clipboard.writeText(text)` (with try/catch if needed). Build the string from `result.purpose` and the four fields, using the same labels as in the UI (via `t('ikigai.purpose')`, etc.).

### 4.4 Visual and accessibility

- **Distinctive and beautiful**: Avoid generic “AI” look. Use a cohesive color system (e.g. rose/pink accent already used for Ikigai in the app: border-rose, bg-rose-50, etc.) and clear typography. The view should feel like a **premium, framework-specific** artifact (like EisenhowerView and ParetoView).
- **Accessibility**: Semantic HTML (headings, sections). Any icon-only button (e.g. copy) must have **`aria-label`** and **`title`**. Focus states and keyboard navigation where relevant.

### 4.5 Teaser and wrapper

- The **`Wrapper`** in `WizardResult` already applies blur and “Unlock full blueprint” overlay when `(result as any).isTeaser` is true. **Do not** duplicate this logic inside `IkigaiView`. Just render the view; the parent wraps it with `Wrapper`.

---

## 5. Reference: existing View components

- **`EisenhowerView.tsx`** – 2×2 grid, quadrant cards with labels, copy per quadrant, “Copy Strategy” for full, `EditableText` per item, reorder with up/down, add/delete. Use for: structure of a “view” component, copy pattern, `updateResult` usage.
- **`ParetoView.tsx`** – Two main blocks (Vital / Trivial), copy per list and full, editable list with reorder. Use for: layout of two emphasized sections, button styling.
- **`MandalaView.tsx`** – More complex (grid of clusters, zoom). Use for: how a view is exported and used from WizardResult (thin branch, `result` + `updateResult`).

Prefer the **same UI primitives** (EditableText, toast for feedback) and **same design tokens** (Tailwind, motion if used elsewhere in the wizard) so the Ikigai view feels part of the same product.

---

## 6. Technical constraints

- **No backend or API changes.** The Ikigai blueprint shape is already produced by the agent and stored; you only implement the view and wire it in WizardResult.
- **Paths for `updateResult`**: Use only the keys above: `['purpose']`, `['love']`, `['goodAt']`, `['worldNeeds']`, `['paidFor']`. No array indices (Ikigai has no lists).
- **PDF / calendar export**: Not required for this task. The app may already have a fallback for Ikigai in PDF export; no need to change it in this prompt.

---

## 7. Acceptance criteria (summary)

- [ ] **New file** `src/app/components/wizard/IkigaiView.tsx` with props `result` and `updateResult`.
- [ ] **WizardResult.tsx** uses it: for `result.type === 'ikigai'`, render `<Wrapper><IkigaiView result={result} updateResult={updateResult} /></Wrapper>` and **remove** the current inline Ikigai JSX.
- [ ] **Layout**: Purpose is visually central (or top); the four fields (love, goodAt, worldNeeds, paidFor) are clearly laid out (e.g. 2×2 or four distinct sections). Design reflects the “four circles + center” Ikigai concept and is distinctive, responsive, and dark-mode capable.
- [ ] **Editing**: All five fields are editable in place; changes persist via `updateResult`.
- [ ] **Copy**: User can copy each section (purpose, love, goodAt, worldNeeds, paidFor) and can copy the full Ikigai (“Copy Strategy” or “Copy full Ikigai”) with feedback (e.g. toast).
- [ ] **Accessibility**: Semantic structure; `aria-label` and `title` on icon-only buttons.
- [ ] **No regressions**: Other result types (Mandala, Eisenhower, Pareto, OKR, first-principles, RPM, Misogi) still render as before. Teaser Ikigai plans still show the same overlay when `result.isTeaser` is true.

---

## 8. Out of scope

- Changing the Ikigai data shape or the agent.
- Adding reorder (Ikigai has no lists).
- PDF or calendar export changes (unless a one-line fix is needed to avoid errors).
- Backend or API work.

Focus only on the **Ikigai view component** and its integration into WizardResult so that Ikigai has the same quality of final-product UI as Mandala, Eisenhower, and Pareto.
