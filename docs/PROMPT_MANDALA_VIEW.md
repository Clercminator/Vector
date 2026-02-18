# Prompt: Build the Mandala Chart live UI (Vector app)

## Context

You are implementing a feature for **Vector**, a React (TypeScript) web app that turns user goals into structured plans using different “frameworks.” When the AI agent finishes a plan, the app shows a framework-specific result view. Right now, **Mandala Chart** plans have no dedicated view (they fall through and show nothing). Your job is to add a **live, interactive Mandala Chart UI** that appears only when the final plan is a Mandala.

This is **not** a static image or illustration. It is a **live UI**: the user can read, copy, edit, and reorder content. The layout must be **beautiful, distinctive, and responsive**, and it must present a large amount of data (1 central goal + 8 categories × 8 steps = 64 items) in a clear, scannable way.

---

## 1. Where this UI appears

- **Only when the agent has generated the final plan** and that plan is a Mandala:
  - The wizard is in “result” state (user has already gone through the chat and the blueprint has been generated).
  - `result` exists and `result.type === 'mandalas'`.
- This view is rendered inside the existing result flow: **`src/app/components/wizard/WizardResult.tsx`**.
- That file already branches on `result.type` for `pareto`, `eisenhower`, `okr`, `first-principles`, `rpm`, `misogi`. Add a **new branch for `result.type === 'mandalas'`** that renders your Mandala view component.
- Reuse the same **wrapper and teaser logic** as other types: there is an `isTeaser` check and a `Wrapper` that applies blur/overlay when the plan is a teaser (preview). Your Mandala view should be wrapped the same way so teaser Mandala plans also show the “Unlock full blueprint” overlay when applicable.

---

## 2. Data shape (Mandala result)

The agent produces a JSON blueprint with this shape:

```ts
{
  type: 'mandalas';
  centralGoal: string;   // One phrase, e.g. "Best Player" or "Peak health and energy"
  categories: Array<{
    name: string;         // Category label, e.g. "Fitness", "Mental", "Nutrition"
    steps: string[];      // Exactly 8 actionable steps (strings)
  }>;
}
```

- There are **8 categories**.
- Each category has **8 steps** (64 steps total).
- `centralGoal` is the single “core” goal in the center of the Mandala concept.

Use this shape for typing (e.g. a small interface in the component or in a shared types file) and assume the data may already be stored in the app’s blueprint state (no need to change the agent or API).

---

## 3. Editing and persistence (critical)

- All edits must **persist into the same result object** the rest of the app uses (save, PDF, etc.).
- The result is updated via **`updateResult(path: string[], value: any)`** passed into `WizardResult` from the parent.
  - `path` is an array of keys/indexes into the result object.
  - Examples:
    - `updateResult(['centralGoal'], newValue)` — edit the central goal.
    - `updateResult(['categories', 2, 'name'], newName)` — edit category 2’s name.
    - `updateResult(['categories', 2, 'steps'], newStepsArray)` — replace all 8 steps of category 2.
    - `updateResult(['categories', 2, 'steps', 5], newStepText)` — edit the 6th step of category 2.
- Reordering (e.g. reorder steps within a category, or reorder categories) is done by building a new array and calling `updateResult` with the appropriate path (e.g. `['categories', i, 'steps']` or `['categories']`).
- The app already has **`EditableText`** and **`EditableList`** used in `WizardResult.tsx` for other frameworks; they are exported from `src/app/components/Editable.tsx`. Use or extend them where it makes sense. Use or extend them where it makes sense so that:
  - The central goal and category names are **editable in place**.
  - Each step text is **editable in place**.
  - **Reorder** is supported where you offer it (e.g. drag-and-drop within a category’s steps, or reordering categories). If `EditableList` supports reorder, use it; otherwise implement a small drag-and-drop (e.g. with a library the project already uses, or a minimal implementation) and then call `updateResult` with the new array.

---

## 4. Interactions the user must have

- **Copy**: Users should be able to copy text (e.g. central goal, a category name, a step, or the whole chart). At minimum:
  - Copy from individual cells/fields (select text or a dedicated “Copy” control).
  - Optionally: a “Copy full Mandala” that copies a readable text or markdown version of the whole chart (central goal + all categories and steps). Prefer a single, clear interaction (e.g. one button or one context menu).
- **Modify**: Every text element that is part of the plan should be editable:
  - Central goal.
  - Each category name.
  - Each of the 64 steps.
  - Edits must flow through `updateResult` so that Save/PDF and any future export see the updated data.
- **Change order**:
  - **Steps within a category**: User can reorder the 8 steps in a category (e.g. drag-and-drop or up/down buttons). Persist via `updateResult(['categories', i, 'steps'], newOrderedSteps)`.
  - **Categories**: User can reorder the 8 categories (e.g. drag-and-drop or arrows). Persist via `updateResult(['categories'], newOrderedCategories)`.
  - If the project already has a pattern for reorder (e.g. `EditableList` with reorder), follow it; otherwise implement a minimal, accessible reorder (keyboard + mouse/touch).

---

## 5. Layout and visual design

- **Structure**: The Mandala Chart is conceptually “one central goal + 8 categories around it, each with 8 steps.” You can choose a literal radial layout (center cell + 8 “petals” or segments) or a more grid-like layout (e.g. center block + 8 category cards/sections, each showing its 8 steps). The important part is that the **central goal is clearly the center** and the **8 categories and their steps are clearly grouped** and easy to scan.
- **Space**: 64 steps plus labels take a lot of space. Prefer a **dynamic, responsive** layout:
  - **Collapse/expand**: e.g. each category is a card or section that can be collapsed to show only the category name (and maybe step count), and expanded to show all 8 steps. Default can be “all expanded” or “all collapsed” or “first expanded, rest collapsed” — choose what gives the best first impression without overwhelming.
  - **Responsive**: On small screens, the layout should stack or simplify (e.g. center goal on top, then 8 category blocks stacked) so nothing is broken or unreadable.
- **Beauty and distinctiveness**:
  - Avoid generic “AI” look: no default purple gradients, no overused “tech” clichés. Prefer a **distinct, memorable** aesthetic that fits a goal-setting / life-planning product (e.g. calm, clear, slightly aspirational).
  - Use the app’s existing design tokens if present (e.g. colors, radii, shadows from Tailwind or a theme). If the app supports dark mode, the Mandala view must **support dark mode** and look good in both themes.
  - Typography and spacing should make the chart feel **premium and easy to use**: clear hierarchy (central goal > category names > steps), enough whitespace, readable font sizes. Consider a subtle background or border treatment so the Mandala feels like a single, cohesive “artifact” (e.g. one big card or canvas) rather than a random list.
- **Accessibility**: Use semantic HTML, readable contrast, and focus states. If you add “Copy” or “Reorder” controls, make them keyboard-accessible and, if possible, screen-reader friendly (e.g. “Reorder steps in Fitness”, “Copy central goal”).

---

## 6. Technical constraints and hints

- **Stack**: React (TypeScript), existing Vector codebase. Use the same UI primitives and styling approach as the rest of the wizard (e.g. Tailwind, motion if already used in WizardResult).
- **No backend changes**: Assume the Mandala blueprint is already produced by the agent and stored in the app state. You only need to **display and edit** it and pass edits back via `updateResult`.
- **Placement**: Implement the view as one or more components (e.g. `MandalaView` or `MandalaChart`) and render them from `WizardResult.tsx` when `result.type === 'mandalas'`. Keep the branch thin: e.g. `<Wrapper><MandalaView result={result} updateResult={updateResult} /></Wrapper>`.
- **PDF / Export**: This task does **not** require implementing PDF or image export of the Mandala. The product decision is that the primary deliverable for Mandala is this live UI; PDF is not the main output. You can leave a short comment in code or a TODO like “Mandala: consider image export later” if useful, but do not build it in this task.
- **Performance**: With 64 editable fields and optional drag-and-drop, avoid unnecessary re-renders (e.g. local state only where needed, and pass stable callbacks or use the same patterns as other result views in WizardResult).

---

## 7. Acceptance criteria (summary)

- When `result.type === 'mandalas'`, the user sees a **Mandala Chart UI** (not a blank or generic view).
- **Central goal** is visually central and **editable**; **8 categories** are clearly laid out; each category has **8 steps**, all **editable**.
- User can **reorder** steps within a category and **reorder** categories; order is persisted via `updateResult`.
- User can **copy** at least individual parts (and ideally the full chart) in a practical way.
- Layout is **responsive** and handles 64 items without feeling like a wall of text (e.g. collapse/expand or clear visual grouping).
- Design is **beautiful and distinctive**, supports **dark mode** if the app does, and fits the rest of the wizard.
- Teaser Mandala plans still show the same upgrade overlay as other frameworks (wrapper/blur when `isTeaser`).
- No regressions: other result types (Pareto, Eisenhower, OKR, etc.) still render as before.

---

## 8. Out of scope for this task

- Eisenhower or Pareto custom views (those come later).
- PDF or image export of the Mandala.
- Changing how the agent generates the Mandala (data shape stays as above).
- Backend or API changes.

Focus only on the **Mandala Chart live UI** integrated into the existing wizard result flow, with edit, reorder, copy, and a polished, responsive layout.
