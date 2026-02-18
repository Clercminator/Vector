# Prompt: Complete Mandala UI + Add Eisenhower & Pareto Custom Views (Vector app)

## Context

You are working on **Vector**, a React (TypeScript) web app that turns user goals into structured plans using different “frameworks.” When the AI agent finishes a plan, the app shows a framework-specific result view in **`src/app/components/wizard/WizardResult.tsx`**, which branches on `result.type`.

Your task has **three parts**:

1. **Complete the Mandala view** – Add the missing Copy and Reorder features and fix any remaining bugs in the existing `MandalaView` component.
2. **Add a dedicated Eisenhower Matrix view** – Replace the current inline Eisenhower block in `WizardResult.tsx` with a new **`EisenhowerView`** component that presents a true 2×2 matrix (Urgent/Important) and is interactive, beautiful, and consistent with the framework-specific view pattern.
3. **Add a dedicated Pareto view** – Replace the current inline Pareto block in `WizardResult.tsx` with a new **`ParetoView`** component that clearly emphasizes “Vital few” vs “Trivial many,” is interactive and beautiful, and follows the same pattern.

All three views must be **live UIs**: users can read, copy, edit, and reorder content. Edits must persist via **`updateResult(path, value)`** so Save and PDF export see the updated data. Use the existing **`Wrapper`** and **teaser overlay** (blur + “Unlock full blueprint”) for each view so teaser plans behave like other frameworks.

---

# Part 1: Complete the Mandala View (`MandalaView.tsx`)

## 1.1 Current state

- **Location**: `src/app/components/wizard/MandalaView.tsx`
- The component already exists: infinite-canvas style 3×3 cluster grid, center = central goal + 8 category names, 8 satellites = category name + 8 steps. All text is editable via `EditableText` and `updateResult`.
- **Missing**: Copy (per cell and full chart), Reorder (steps within a category, order of categories). A few bugs and conventions need fixing.

## 1.2 Bugs and conventions to fix

- **`updateResult` paths must use numeric array indices.**  
  Use **numbers** for array indexes (e.g. `['categories', 0, 'name']`, `['categories', 2, 'steps']`), **not** strings (e.g. `'0'`). The rest of the app and the parent’s `updateResult` logic expect numeric indices when indexing into arrays.
- **Guard against missing data.**  
  When `result.categories` is undefined or has fewer than 8 items (e.g. teaser or malformed data), guard before accessing `result.categories[catIndex]` and `category.steps`. Use optional chaining and fallbacks (e.g. `category?.steps ?? []`) and skip rendering a satellite cluster if the category is missing.
- **Accessibility.**  
  Any icon-only button (e.g. zoom in, zoom out, reset view, copy) must have **`aria-label`** and **`title`** so assistive technologies and keyboard users have discernible text. Remove unused imports (e.g. `Copy` if not yet used, or use it for the Copy feature).

## 1.3 Copy (required)

- **Per-cell / per-field copy**  
  Users must be able to copy the text of the central goal, any category name, or any of the 64 steps. Options:
  - **Option A**: Native text selection is sufficient (user selects text and copies), and/or a small “Copy” control (icon or context menu) on each cell or on focus.
  - **Option B**: A “Copy” button or icon on each cluster (or on each cell) that copies that cluster’s title + items (or that cell’s value) to the clipboard.
- **“Copy full Mandala”**  
  Provide one clear action that copies the **entire chart** to the clipboard in a readable format (e.g. plain text or markdown: central goal, then each category name with its 8 steps). Prefer a single, visible control (e.g. a “Copy full chart” or “Copy Mandala” button in the toolbar or top of the view). After copy, give brief feedback (e.g. toast or inline “Copied!”).

Implementation note: Use `navigator.clipboard.writeText(text)` (with a fallback or try/catch for older browsers if needed). Build the string from `result.centralGoal` and `result.categories` (name + steps).

## 1.4 Reorder (required)

- **Steps within a category**  
  The user must be able to **reorder the 8 steps** inside a single category (e.g. drag-and-drop or up/down buttons). Persist by building the new ordered array and calling **`updateResult(['categories', catIndex, 'steps'], newOrderedSteps)`**.
- **Categories**  
  The user must be able to **reorder the 8 categories** (e.g. drag-and-drop or up/down arrows). Persist by calling **`updateResult(['categories'], newOrderedCategories)`** (array of `{ name, steps }` in the new order).

You can use the existing **`EditableList`** from `src/app/components/Editable.tsx` as reference; it does **not** support reorder today, so you must add reorder UI (e.g. drag handles + a small DnD library the project already uses, or up/down buttons that move an item and then call `updateResult` with the new array). Prefer an approach that is keyboard-accessible and screen-reader friendly where possible (e.g. “Move step up”, “Move step down”, “Reorder categories”).

## 1.5 Acceptance (Mandala)

- Copy: user can copy individual cells/fields and the full Mandala (one clear “Copy full chart” action with feedback).
- Reorder: user can reorder steps within a category and reorder categories; order persists after Save.
- No string indices in `updateResult` paths; guards for missing categories/steps; icon buttons have `aria-label`/`title`.
- No regressions: Mandala still shows when `result.type === 'mandalas'`, still editable, still works with teaser overlay.

---

# Part 2: Eisenhower Matrix View (`EisenhowerView.tsx`)

## 2.1 Goal

Create a **dedicated component** that presents the Eisenhower result as a **true 2×2 matrix**: two axes (e.g. Urgent / Not Urgent, Important / Not Important) and four quadrants. The framework is about **prioritization by urgency and importance**, so the UI should look like the classic Eisenhower box (four quadrants), not just four lists in a grid.

## 2.2 Data shape

```ts
{
  type: 'eisenhower';
  q1: string[];  // Urgent & Important — "Do first"
  q2: string[];  // Not Urgent & Important — "Schedule"
  q3: string[];  // Urgent & Not Important — "Delegate"
  q4: string[];  // Not Urgent & Not Important — "Eliminate"
}
```

Existing translation keys (use `t()` from `useLanguage()`):  
`eisenhower.do`, `eisenhower.schedule`, `eisenhower.delegate`, `eisenhower.eliminate`.

## 2.3 Where it’s used

- In **`WizardResult.tsx`**, when `result.type === 'eisenhower'`, **replace** the current inline JSX with:  
  **`<Wrapper><EisenhowerView result={result} updateResult={updateResult} /></Wrapper>`**.
- Create **`src/app/components/wizard/EisenhowerView.tsx`**. Props: `result` (Eisenhower result), `updateResult(path: string[], value: any)`.

## 2.4 Behaviour and design

- **Layout**: A clear **2×2 matrix** (e.g. one row “Urgent” / “Not Urgent”, one column “Important” / “Not Important”, or equivalent). Each quadrant shows its label (Do, Schedule, Delegate, Eliminate) and the list of items. Use the same quadrant semantics and colors as the current design (Q1=red/urgent-important, Q2=blue/schedule, Q3=amber/delegate, Q4=gray/eliminate) so the result stays recognizable, but improve the **visual structure** so it reads as a matrix (axes, borders, or clear quadrant separation).
- **Editing**: Every item in `q1`, `q2`, `q3`, `q4` is **editable in place** (e.g. `EditableText` or `EditableList`). Persist via `updateResult(['q1'], val)`, `updateResult(['q2'], val)`, etc., with `val` being the full array for that quadrant.
- **Reorder**: User can **reorder items within each quadrant** (e.g. drag-and-drop or up/down). Persist by passing the new array: `updateResult(['q1'], newQ1)`, etc.
- **Copy**: At least **copy per quadrant** (e.g. “Copy Q1” copies all items in that quadrant as text). Optionally a “Copy full matrix” that copies all four quadrants in a readable format.
- **Optional (nice to have)**: Drag an item from one quadrant to another (update both `qX` and `qY` via two `updateResult` calls). Not mandatory for this task.
- **Visual**: Beautiful, distinctive, responsive. Support **dark mode** if the app does. Avoid generic “AI” look. Use the app’s existing design tokens (Tailwind, motion if used elsewhere in the wizard).
- **Accessibility**: Semantic HTML, focus states, and `aria-label`/`title` on icon-only buttons.

## 2.5 Acceptance (Eisenhower)

- New file `EisenhowerView.tsx`; WizardResult uses it for `result.type === 'eisenhower'` inside `Wrapper`.
- 2×2 matrix layout with clear quadrant labels; all items editable; reorder within quadrant; copy per quadrant (and optionally full matrix).
- Teaser overlay works when `result.isTeaser`; no regressions for other result types.

---

# Part 3: Pareto View (`ParetoView.tsx`)

## 3.1 Goal

Create a **dedicated component** that presents the Pareto (80/20) result with a clear **“Vital few” vs “Trivial many”** split. The UI should make the distinction between the high-impact 20% and the rest visually obvious (e.g. two columns or two blocks with different visual weight, typography, or emphasis).

## 3.2 Data shape

```ts
{
  type: 'pareto';
  vital: string[];   // The Vital Few (20%)
  trivial: string[]; // The Trivial Many (80%)
}
```

Existing translation keys: `pareto.vital` (“The Vital Few (20%)”), `pareto.trivial` (“The Trivial Many (80%)”).

## 3.3 Where it’s used

- In **`WizardResult.tsx`**, when `result.type === 'pareto'`, **replace** the current inline JSX with:  
  **`<Wrapper><ParetoView result={result} updateResult={updateResult} /></Wrapper>`**.
- Create **`src/app/components/wizard/ParetoView.tsx`**. Props: `result` (Pareto result), `updateResult(path: string[], value: any)`.

## 3.4 Behaviour and design

- **Layout**: Clear **two-sided layout** (e.g. two columns or two stacked sections). One side is **Vital few** (emphasized: primary color, stronger typography, or visual hierarchy); the other is **Trivial many** (secondary: muted, or visually “lighter”). The user should immediately see “this side is the 20% that matters, this side is the rest.”
- **Editing**: Every item in `vital` and `trivial` is **editable in place**. Persist via `updateResult(['vital'], val)` and `updateResult(['trivial'], val)` (val = full array).
- **Reorder**: User can **reorder items within Vital** and **within Trivial**. Persist by calling `updateResult(['vital'], newVital)` and `updateResult(['trivial'], newTrivial)`.
- **Copy**: At least copy one list (e.g. “Copy Vital list”, “Copy Trivial list”); optionally “Copy full Pareto” (both lists in one text).
- **Visual**: Beautiful, distinctive, responsive, dark-mode capable. Use existing design system; avoid generic AI aesthetics.
- **Accessibility**: Semantic HTML, focus states, and labels on icon-only buttons.

## 3.5 Acceptance (Pareto)

- New file `ParetoView.tsx`; WizardResult uses it for `result.type === 'pareto'` inside `Wrapper`.
- Clear Vital vs Trivial layout; all items editable; reorder within each list; copy (per list and optionally full).
- Teaser overlay works; no regressions for other result types.

---

# Part 4: Shared technical rules

## 4.1 Persistence

- **All edits** go through **`updateResult(path: string[], value: any)`**.
- **Paths**: Use **numeric** indices for array elements (e.g. `['categories', 0, 'steps']`), not string indices.
- **Reorder**: Implement by building the new array (e.g. reordered copy of `result.q1` or `result.categories`) and calling `updateResult` with the appropriate path and the new array.

## 4.2 Primitives

- **Editable text/list**: Use **`EditableText`** and **`EditableList`** from **`src/app/components/Editable.tsx`** where they fit. **EditableList** does not support reorder today; add reorder in your view (e.g. drag handles + DnD, or up/down buttons) and then call `onChange(newOrderedArray)` or the equivalent `updateResult` path.
- **Translations**: Use **`useLanguage()`** and **`t('key')`** for all user-facing strings that already have keys (e.g. `eisenhower.do`, `pareto.vital`). Add new keys in `src/lib/translations.ts` only for strings that don’t exist yet (e.g. “Copy full chart”, “Copy quadrant”).

## 4.3 WizardResult integration

- Each view receives **`result`** and **`updateResult`** from `WizardResult`. Keep the branch thin, e.g.:
  - `result.type === 'mandalas'` → `<Wrapper><MandalaView result={result} updateResult={updateResult} /></Wrapper>`
  - `result.type === 'eisenhower'` → `<Wrapper><EisenhowerView result={result} updateResult={updateResult} /></Wrapper>`
  - `result.type === 'pareto'` → `<Wrapper><ParetoView result={result} updateResult={updateResult} /></Wrapper>`
- **Wrapper** already applies blur + overlay when `(result as any).isTeaser` is true. Do not duplicate that logic inside the view components.

## 4.4 Out of scope

- No backend or API changes.
- No changes to how the agent produces Mandala, Eisenhower, or Pareto JSON (data shapes stay as above).
- PDF or image export for these three frameworks is not required in this task.

---

# Part 5: Summary checklist

- [ ] **Mandala**: Copy (per cell + “Copy full chart” with feedback); Reorder (steps within category, categories); paths use numbers; guards for missing data; accessibility on icon buttons.
- [ ] **Eisenhower**: New `EisenhowerView.tsx`; 2×2 matrix layout; editable + reorder per quadrant; copy (per quadrant, optionally full); used in WizardResult for `eisenhower`; Wrapper + teaser.
- [ ] **Pareto**: New `ParetoView.tsx`; Vital vs Trivial layout; editable + reorder per list; copy (per list, optionally full); used in WizardResult for `pareto`; Wrapper + teaser.
- [ ] No regressions: OKR, first-principles, RPM, Misogi, and any other result types still render as they do today.
