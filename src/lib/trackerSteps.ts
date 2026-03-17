import { BlueprintResult } from "./blueprints";

/** Get value from result supporting both camelCase and snake_case (API may return either). */
function getResultArray(result: any, camelKey: string, snakeKey?: string): string[] | undefined {
  const arr = result[camelKey] ?? result[snakeKey ?? camelKey.replace(/([A-Z])/g, "_$1").toLowerCase()];
  return Array.isArray(arr) ? arr : undefined;
}

function getResultString(result: any, camelKey: string, snakeKey?: string): string | undefined {
  const s = result[camelKey] ?? result[snakeKey ?? camelKey.replace(/([A-Z])/g, "_$1").toLowerCase()];
  return typeof s === "string" ? s : undefined;
}

export function inferPlanKind(
  result: BlueprintResult,
  framework: string,
): "finite" | "infinite" {
  const finiteFrameworks = ["rpm", "okr", "eisenhower", "mandalas", "pareto", "first-principles", "misogi", "dsss", "gps", "ikigai"];
  if (finiteFrameworks.includes(framework)) {
    return "finite";
  }
  return "infinite";
}

export function getStepIdsAndLabels(
  result: BlueprintResult,
  framework: string,
): { stepId: string; label: string }[] {
  if (!result || typeof result !== "object") return [];

  const steps: { stepId: string; label: string }[] = [];
  const r = result as any;

  switch (framework) {
    case "rpm": {
      const plan = getResultArray(r, "plan");
      if (plan?.length) {
        return plan.map((step, index) => ({
          stepId: `plan.${index}`,
          label: step,
        }));
      }
      break;
    }
    case "okr": {
      const keyResults = getResultArray(r, "keyResults", "key_results");
      if (keyResults?.length) {
        return keyResults.map((kr, index) => ({
          stepId: `keyResults.${index}`,
          label: kr,
        }));
      }
      break;
    }
    case "eisenhower": {
      const quadrants = ["q1", "q2", "q3", "q4"] as const;
      for (const q of quadrants) {
        if (q in result && Array.isArray((result as any)[q])) {
          (result as any)[q].forEach((task: string, index: number) => {
            steps.push({
              stepId: `${q}.${index}`,
              label: `[${q.toUpperCase()}] ${task}`,
            });
          });
        }
      }
      break;
    }
    case "mandalas": {
      const categories = r.categories as Array<{ name?: string; steps?: string[] }> | undefined;
      if (Array.isArray(categories)) {
        categories.forEach((cat: any, catIndex: number) => {
          const stepList = Array.isArray(cat?.steps) ? cat.steps : [];
          const name = cat?.name ?? "Category";
          stepList.forEach((step: string, stepIndex: number) => {
            steps.push({
              stepId: `categories.${catIndex}.steps.${stepIndex}`,
              label: `[${name}] ${step}`,
            });
          });
        });
      }
      break;
    }
    case "pareto": {
      if ("vital" in result && Array.isArray((result as any).vital)) {
        (result as any).vital.forEach((item: string, idx: number) => {
          steps.push({ stepId: `vital.${idx}`, label: `Vital: ${item}` });
        });
      }
      if ("trivial" in result && Array.isArray((result as any).trivial)) {
        (result as any).trivial.forEach((item: string, idx: number) => {
          steps.push({ stepId: `trivial.${idx}`, label: `Trivial: ${item}` });
        });
      }
      break;
    }
    case "first-principles": {
      if ("truths" in result && Array.isArray((result as any).truths)) {
        (result as any).truths.forEach((truth: string, idx: number) => {
          steps.push({ stepId: `truths.${idx}`, label: truth });
        });
      }
      break;
    }
    case "misogi": {
      const fields = ["challenge", "gap", "purification"];
      fields.forEach(field => {
        if (field in result) {
          const val = (result as any)[field];
          if (Array.isArray(val)) {
            val.forEach((item, idx) => {
              steps.push({ stepId: `${field}.${idx}`, label: `[${field.toUpperCase()}] ${item}` });
            });
          } else if (typeof val === "string") {
            steps.push({ stepId: field, label: `[${field.toUpperCase()}] ${val}` });
          }
        }
      });
      break;
    }
    case "dsss": {
      const fields = ["deconstruct", "selection", "sequence", "stakes"];
      fields.forEach(field => {
        if (field in result) {
          const val = (result as any)[field];
          if (Array.isArray(val)) {
            val.forEach((item, idx) => {
              steps.push({ stepId: `${field}.${idx}`, label: `[${field.toUpperCase()}] ${item}` });
            });
          } else if (typeof val === "string") {
            steps.push({ stepId: field, label: `[${field.toUpperCase()}] ${val}` });
          }
        }
      });
      break;
    }
    case "gps": {
      const fields = ["plan", "system"];
      fields.forEach(field => {
        if (field in result && Array.isArray((result as any)[field])) {
          (result as any)[field].forEach((item: string, idx: number) => {
             steps.push({ stepId: `${field}.${idx}`, label: `[${field.toUpperCase()}] ${item}` });
          });
        }
      });
      break;
    }
    case "ikigai": {
      const pillarKeys = [
        ["love", "love"],
        ["goodAt", "good_at"],
        ["worldNeeds", "world_needs"],
        ["paidFor", "paid_for"],
        ["purpose", "purpose"],
      ] as const;
      pillarKeys.forEach(([camel, snake], idx) => {
        const val = r[camel] ?? r[snake];
        if (typeof val === "string" && val.trim()) {
          steps.push({ stepId: `pillar.${idx}`, label: `[${camel.toUpperCase()}] ${val}` });
        }
      });
      break;
    }
    case "general": {
      const stepsArr = getResultArray(r, "steps");
      if (stepsArr?.length) {
        return stepsArr.map((step, index) => ({
          stepId: `steps.${index}`,
          label: step,
        }));
      }
      break;
    }
    default:
      return [];
  }
  return steps;
}
