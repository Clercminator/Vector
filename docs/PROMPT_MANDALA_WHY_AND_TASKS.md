# Prompt: Mandala "Why" + Generated Tasks + Agent Instructions

## Context

The Mandala Chart result should include **explanations** ("why" behind each pillar and cell) and **actionable tasks** for each step. The agent must output these so users understand the reasoning and can work on concrete sub-tasks (e.g. "Practice pronunciation with ChatGPT for 30 min 3 days a week" under "Improve English proficiency for potential international clients").

---

## 1. Data Shape (extended)

Keep existing fields; add optional fields so existing blueprints still work.

```ts
// Category (pillar)
{
  name: string;
  steps: string[];           // 8 steps, as today
  why?: string;              // Why this pillar was chosen for the central goal
  stepWhys?: string[];       // Length 8: why each step was chosen (optional)
  stepSubTasks?: string[][]; // Length 8: each element is string[] of bullet-point tasks for that step
}
```

- **centralGoal**: unchanged.
- **categories[].why**: One short paragraph explaining why this category supports the central goal.
- **categories[].stepWhys**: Optional array of 8 strings; `stepWhys[i]` explains why step `i` was chosen for this pillar.
- **categories[].stepSubTasks**: Optional array of 8 arrays; `stepSubTasks[i]` is a list of concrete sub-tasks (bullet points) for step `i`. Example: `["Practice pronunciation with ChatGPT for 30 min 3 days a week", "Join a weekly English conversation club"]`.

---

## 2. Agent Instructions

Update the agent prompt and output schema so that for Mandala blueprints it:

1. **Outputs `why` for each category (pillar)**  
   For each of the 8 categories, include a short explanation of why that pillar supports the central goal (e.g. "Revenue Generation directly fuels the goal; without it, the rest cannot scale.").

2. **Outputs `stepWhys` for each step (optional but recommended)**  
   For each of the 8 steps in each category, optionally include one sentence on why that step was chosen (e.g. "Improving English opens international client pipelines.").

3. **Outputs `stepSubTasks` (generated tasks)**  
   For each step, generate 2–5 concrete, actionable sub-tasks the user can do (e.g. "Practice pronunciation with ChatGPT for 30 min 3 days a week", "Complete one B2-level writing exercise per week"). Store as `stepSubTasks[i]`: array of strings for step index `i`.

4. **Keeps existing structure**  
   Still output `centralGoal` and `categories` with `name` and `steps` (8 strings each). Add `why`, `stepWhys`, and `stepSubTasks` when generating a Mandala blueprint.

---

## 3. UI (already implemented or to wire)

- **Overview / drill-down**: When `category.why` is present, show it (e.g. above the cluster grid or in a collapsible "Why this pillar" section).
- **Cell detail panel**: When the user opens a step (e.g. "Improve English proficiency..."), show:
  - The step text (editable).
  - "Why this step" (editable), from `stepWhys[stepIndex]`.
  - "Sub-tasks" (editable list), from `stepSubTasks[stepIndex]`, with add/remove and persistence via `updateResult`.

The frontend supports optional `why`, `stepWhys`, and `stepSubTasks` on each category; the agent only needs to populate them.

---

## 4. Validation

- In the Mandala validator, allow but do not require `why`, `stepWhys`, and `stepSubTasks`.
- Ensure `stepWhys` and `stepSubTasks` have length 8 when present (one entry per step).

---

## 5. Acceptance Criteria

- [ ] Agent generates Mandala blueprints that include `categories[].why` when possible.
- [ ] Agent generates `categories[].stepSubTasks` (array of 8 arrays of task strings) for each category.
- [ ] Optionally, agent generates `categories[].stepWhys` (array of 8 strings) per category.
- [ ] UI displays "why" for pillar and step where available.
- [ ] User can add/edit/remove sub-tasks per step in the cell detail panel; changes persist via `updateResult`.

Focus agent work on **outputting** `why`, `stepWhys`, and `stepSubTasks` in the Mandala JSON. The UI for viewing and editing these is implemented in `MandalaView` (cell detail panel and optional "why" display).
