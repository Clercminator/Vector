# Prompt: Mandala Grid UI/UX Improvements (Vector app)

## Context

You are improving the **Mandala Chart** result view in **Vector**, a React (TypeScript) web app that turns user goals into structured plans. The Mandala view already exists at **`src/app/components/wizard/MandalaView.tsx`** and renders a 3×3 cluster grid: center = central goal + 8 category names, 8 satellites = category name + 8 steps each. All text is editable and copy/reorder are supported.

User feedback and UX analysis indicate the current grid feels **cluttered, hard to read, and visually overwhelming**. Your job is to improve the Mandala grid UI/UX while keeping all existing behavior (edit, reorder, copy, persistence via `updateResult`).

---

## 1. Current Implementation Reference

- **Component**: `src/app/components/wizard/MandalaView.tsx`
- **Data shape**: `result.type === 'mandalas'` with `centralGoal` and `categories[]` (each with `name` and `steps[]` of 8 strings).
- **Behavior**: Infinite-canvas style grid with zoom/pan; click-to-focus clusters; `EditableText` for all cells; copy and reorder controls (shown on focus/hover).
- **Stack**: React, TypeScript, Tailwind, `motion/react` (Framer Motion), `EditableText` from `src/app/components/Editable.tsx`.

---

## 2. Problems to Address

### 2.1 Layout & Density
- Grid clusters and cells are **too tightly packed** (`gap-1 md:gap-2` between cells; `gap-2 md:gap-6` between clusters). The result feels cramped.
- Cells are small (`aspect-square`, minimal padding). Long step text has very little room to breathe.

### 2.2 Text Readability
- Step/category text uses **very small font sizes**: `text-[8px] md:text-[10px] lg:text-xs`. This is illegible for many users.
- Cells use `overflow-auto` with `scrollbar-hide`, so long content scrolls but scrollbars are invisible. Users perceive content as truncated with no way to see the rest.

### 2.3 Contrast & Visual Hierarchy
- Body text (`text-zinc-700 dark:text-zinc-300`) on `bg-white/60 dark:bg-zinc-900/60` can have low contrast, especially in dark mode.
- Category titles (blue) stand out, but the eight steps inside each cluster lack clear visual hierarchy. Scanning 64 steps is exhausting.

### 2.4 Cell Controls (Copy, Reorder)
- Copy and reorder buttons use icons at `size={10}` and are nearly invisible.
- Controls use `opacity-0 group-hover/cell:opacity-100`, so they only appear on hover; users don't discover them.
- Controls are positioned at `-top-2 -right-2` and may clip outside the cell or overlap other elements.

### 2.5 Information Overload
- 64 items in a single dense grid can feel like a wall of text. There is no way to focus on one category or reduce visual noise.

---

## 3. Required Improvements

### 3.1 Layout & Spacing
- **Increase gaps** between cells and clusters so the grid feels less cramped. Target at least `gap-2 md:gap-3` for cells and `gap-4 md:gap-8` for clusters (or equivalent).
- **Consider non-square cells** for step items (e.g. taller aspect ratio or min-height) to give long text more vertical room.
- Preserve responsiveness; the layout must still work on small screens (stack or simplify as needed).

### 3.2 Text Readability
- **Increase font sizes** for step and category text. Minimum: `text-xs md:text-sm` for steps; category titles should be at least `text-sm md:text-base`.
- **Fix overflow behavior**:
  - Option A: Show visible scrollbars when content overflows, or
  - Option B: Use truncation with ellipsis plus a clear affordance (e.g. "Show more" / expand on click), or
  - Option C: Allow cells to grow vertically within reason (e.g. `min-h` with `overflow-auto`) and remove `scrollbar-hide` so users can scroll when needed.
- Ensure text remains readable in both light and dark modes.

### 3.3 Contrast & Visual Hierarchy
- **Improve contrast** for body text (steps, secondary content) against the cell background. Adjust `text-zinc-700 dark:text-zinc-300` or background opacity if needed.
- **Add hierarchy within clusters**: Consider subtle emphasis for the first step or key steps (e.g. slightly bolder or different opacity). The central goal and category names should remain the strongest hierarchy.

### 3.4 Cell Controls Visibility & Affordances
- **Increase icon size** for copy and reorder controls (at least `size={14}` or `16`).
- **Improve discoverability**: Prefer always-visible controls (with lower opacity that increases on hover) over `opacity-0` until hover. Or show controls when the cell/cluster is focused.
- **Ensure controls are reachable**: Position them so they don't clip or overlap. Prefer inside the cell (e.g. bottom-right corner) or clearly associated with the cell.
- **Editable affordance**: The `EditableText` pencil icon appears only on hover. Consider a subtle persistent cue (e.g. light border, placeholder hint) so users understand cells are editable.

### 3.5 Reduce Overwhelm (High Value)
- Implement at least one of:
  - **Tab or accordion view**: Allow the user to view one category at a time (e.g. tabs for each of the 8 categories, or an accordion that expands one category at a time).
  - **Collapsed summaries**: Show only category names by default; expand to reveal the 8 steps on click.
  - **Alternate view mode**: Offer a list/table view alongside (or instead of) the grid for users who prefer linear browsing.
- Default state should feel manageable: avoid "wall of text" on first load. For example: center + category names visible; steps collapsed or shown in a focused view.

### 3.6 Zoom & Navigation
- Add a brief hint when the view loads (e.g. "Click a cluster to zoom in" or "Tap a category to focus") so users understand the interaction.
- Ensure the zoom-to-cluster interaction remains smooth and accessible.

---

## 4. Behavioral and Technical Constraints

- **All edits must persist** via `updateResult(path, value)` exactly as today. No change to data flow or persistence.
- **Copy and reorder** must continue to work (per cell, per cluster, and "Copy full chart"). Improve visibility and usability, but do not remove functionality.
- **Dark mode**: The Mandala view must look good in both light and dark themes.
- **Accessibility**: Keep `aria-label` and `title` on icon-only buttons; ensure focus states and keyboard operability where applicable.
- **Existing structure**: The component receives `result` and `updateResult` from `WizardResult.tsx`. Do not change the props or the integration point.
- **No backend changes**: Only frontend UI/UX in `MandalaView.tsx` (and any new sub-components you introduce).

---

## 5. Implementation Notes

- Use the app's existing design tokens (Tailwind, theme colors). Avoid generic "AI" aesthetics; maintain the goal-planning, calm, aspirational feel described in `PROMPT_MANDALA_VIEW.md`.
- If you add collapse/expand or tabbed views, ensure the full data remains in `result`; only the presentation changes.
- Test with realistic content: long step text (2–3 lines), short step text, and mixed lengths.
- Do not regress: other result types (Pareto, Eisenhower, OKR, etc.) must be unchanged.

---

## 6. Acceptance Criteria

- [ ] Layout is less cramped: increased gaps and spacing; cells feel roomier.
- [ ] Text is readable: step/category font sizes at least `text-xs md:text-sm`; overflow is handled (visible scroll or truncation with expand).
- [ ] Contrast and hierarchy are improved for steps within clusters.
- [ ] Copy and reorder controls are visible or easily discoverable; icons are legible (≥14px).
- [ ] At least one mechanism reduces overwhelm (tabs, accordion, or alternate view).
- [ ] Editable affordance is clearer (e.g. persistent hint or improved pencil visibility).
- [ ] Optional hint for zoom/cluster interaction on first load.
- [ ] Dark mode and accessibility maintained; no regressions to other frameworks.

---

## 7. Out of Scope

- Changes to the agent or data shape.
- PDF or image export of the Mandala.
- Changes to `WizardResult.tsx` beyond passing the same props to `MandalaView`.
- Redesign of other framework views (Eisenhower, Pareto, etc.).

Focus solely on improving the **Mandala grid UI/UX** in `MandalaView.tsx` and any components it composes.
