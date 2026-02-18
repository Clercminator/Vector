# Prompt: Mandala Overview + Cluster Drill-Down (Vector app)

## Context

You are changing the **Mandala Chart** result view in **Vector**, a React (TypeScript) web app. The Mandala view lives in **`src/app/components/wizard/MandalaView.tsx`** and currently renders a 3×3 grid of nine clusters, with every cluster showing all of its cells at once (center cell + 8 steps, or central goal + 8 category names). This creates **information overload**: too much content on screen, small cells, poor readability.

The fix is **not** to keep resizing. Instead, use a **two-level view**:

1. **Overview**: Show only the **nine clusters** as nine rectangles. Inside each rectangle, show **only the center/title cell** (the cluster’s main label: central goal for the center cluster, category name for the eight surrounding clusters). No step cells or other inner cells are visible in the overview.
2. **Cluster drill-down**: When the user **clicks** (or taps) one of the nine clusters, **replace or overlay** the overview with a **single-cluster view** that shows the full grid for that cluster (center/title cell plus all step cells), with enough space to look clean and show everything. Provide a clear way to **go back** to the overview (e.g. “Back to overview”, “←”, or clicking outside).

Result: the overview is minimal and scannable (9 labeled rectangles); the drill-down gives one cluster at a time with room for all cells. All existing behavior (edit, copy, reorder, persistence via `updateResult`) must be preserved.

---

## 1. Current Implementation Reference

- **Component**: `src/app/components/wizard/MandalaView.tsx`
- **Data shape**: `result.type === 'mandalas'` with `centralGoal` and `categories[]` (each with `name` and `steps[]` of 8 strings).
- **Current layout**: 3×3 grid of clusters; center cluster = central goal + 8 category names; 8 satellite clusters = category name + 8 steps each. All cells (including steps) are visible at once, leading to clutter.
- **Stack**: React, TypeScript, Tailwind, `motion/react` (Framer Motion), `EditableText` from `src/app/components/Editable.tsx`.

---

## 2. Required Behavior

### 2.1 Overview (default state)

- **Content**: A 3×3 grid of **nine clickable rectangles** (one per cluster).
- **Per rectangle**: Show **only** the cluster’s “title”:
  - **Center cluster**: the **central goal** (single phrase).
  - **Eight satellite clusters**: each cluster’s **category name** (e.g. "Business", "Systems").
- **No step cells** and no inner grid of 8 steps/category names inside any rectangle in this view. Each rectangle is a single, clear label (the center/title of that cluster).
- **Interaction**: Clicking/tapping a rectangle **opens** the drill-down for that cluster.

### 2.2 Cluster drill-down (focused state)

- **Content**: Show **one cluster only** — the one the user selected. Display its **full grid**: center/title cell plus all 8 surrounding cells (for the center cluster: central goal + 8 category names; for a satellite: category name + 8 steps).
- **Layout**: Use the available space so this single cluster’s grid is **readable and uncluttered** (comfortable cell size, spacing, font size). No need to squeeze other clusters into view.
- **Navigation**: A clear **back** control (e.g. “Back to overview”, “← Overview”, or an icon + label) that returns to the overview (9 rectangles).
- **Behavior**: All existing behavior in this view must work: **editing** (central goal, category names, steps) via `EditableText`, **copy** and **reorder** where already implemented, with all changes persisted via `updateResult(path, value)`.

### 2.3 State and transitions

- **State**: Maintain which view is active (overview vs drill-down) and **which cluster** is selected when in drill-down (e.g. `selectedClusterIndex: number | null`, where `null` = overview, `0` = center, `1..8` = satellite categories in the same order as `result.categories` or your current layout).
- **Transitions**: Optional but recommended: use Framer Motion (or similar) for a short transition when switching between overview and drill-down so the change feels intentional (e.g. fade or scale).

---

## 3. Technical and Behavioral Constraints

- **Persistence**: All edits must continue to go through `updateResult(path, value)`. No change to the result data shape or to how WizardResult passes props.
- **Copy and reorder**: Must still work in the **drill-down** view (per cell, per cluster, and “Copy full chart” if present). Overview rectangles do not need copy/reorder; only the title is visible there.
- **Dark mode**: Both overview and drill-down must look correct in light and dark themes.
- **Accessibility**: Overview rectangles and the back control must be keyboard-accessible and have sensible `aria-label` / `title`. Preserve existing accessibility in the drill-down grid.
- **No backend or agent changes**: Only frontend changes in `MandalaView.tsx` (and any new subcomponents you add). Do not change `WizardResult.tsx` beyond existing integration.

---

## 4. Implementation Notes

- **Mapping clusters**: Ensure a consistent mapping between the 9 overview rectangles and the data: one rectangle for the center (central goal + 8 category names), and one rectangle per category in `result.categories` (each showing category name + 8 steps). When the user clicks a rectangle, open drill-down for that cluster index.
- **Reuse existing grid UI**: In drill-down, reuse the same cell rendering (EditableText, copy, reorder) you already have for that cluster type; only the **layout** and **which cluster is shown** change. Avoid duplicating logic; factor shared “render one cluster’s full grid” into a reusable piece.
- **Design**: Keep the app’s design tokens and the calm, goal-planning aesthetic. Overview rectangles should feel like clear, tappable cards with a single prominent label; drill-down should feel like a focused “zoomed” view of one part of the Mandala.

---

## 5. Acceptance Criteria

- [ ] **Overview**: On load, the user sees exactly 9 rectangles in a 3×3 grid. Each rectangle shows only the cluster’s title (central goal or category name). No step cells or inner grids in the overview.
- [ ] **Drill-down**: Clicking a rectangle shows only that cluster’s full grid (title + all 8 cells), with enough space to read and interact. Editing, copy, and reorder work and persist via `updateResult`.
- [ ] **Back**: A clear control returns the user from drill-down to the overview (9 rectangles).
- [ ] **State**: Correct cluster is shown in drill-down; returning to overview and clicking another rectangle opens the right cluster.
- [ ] **Dark mode and accessibility**: Both views work in both themes and remain keyboard- and screen-reader friendly.
- [ ] **No regressions**: Other result types (Pareto, Eisenhower, OKR, etc.) are unchanged.

---

## 6. Out of Scope

- Changes to the agent or to the Mandala result data shape.
- PDF or image export of the Mandala.
- Changes to other framework views (Eisenhower, Pareto, etc.).

Focus solely on implementing the **overview (9 title-only rectangles) + single-cluster drill-down** in `MandalaView.tsx` and any components it composes.
