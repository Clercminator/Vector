export type FrameworkId = "first-principles" | "pareto" | "rpm" | "eisenhower" | "okr";

export type BlueprintResult =
  | { type: "first-principles"; truths: string[]; newApproach: string }
  | { type: "pareto"; vital: string[]; trivial: string[] }
  | { type: "rpm"; result: string; purpose: string; plan: string[] }
  | { type: "eisenhower"; q1: string[]; q2: string[]; q3: string[]; q4: string[] }
  | { type: "okr"; objective: string; keyResults: string[]; initiative: string }
  | Record<string, unknown>;

export interface Blueprint {
  id: string;
  framework: FrameworkId;
  title: string;
  answers: string[];
  result: BlueprintResult;
  createdAt: string; // ISO string
}

const STORAGE_KEY = "vector.blueprints.v1";

export function loadLocalBlueprints(): Blueprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Blueprint[];
  } catch {
    return [];
  }
}

export function saveLocalBlueprints(blueprints: Blueprint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
}

export function upsertBlueprint(list: Blueprint[], bp: Blueprint): Blueprint[] {
  const idx = list.findIndex((x) => x.id === bp.id);
  if (idx === -1) return [bp, ...list];
  const next = [...list];
  next[idx] = bp;
  return next;
}

export function removeBlueprint(list: Blueprint[], id: string): Blueprint[] {
  return list.filter((x) => x.id !== id);
}

export function blueprintTitleFromAnswers(answers: string[], fallback = "Untitled blueprint") {
  const first = (answers[0] ?? "").trim();
  if (!first) return fallback;
  // Keep titles short for UI.
  return first.length > 60 ? `${first.slice(0, 57)}...` : first;
}

