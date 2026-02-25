import { BlueprintResult } from "./blueprints";

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

  switch (framework) {
    case "rpm": {
      if ("plan" in result && Array.isArray(result.plan)) {
        return result.plan.map((step, index) => ({
          stepId: `plan.${index}`,
          label: step,
        }));
      }
      break;
    }
    case "okr": {
      if ("keyResults" in result && Array.isArray(result.keyResults)) {
        return result.keyResults.map((kr, index) => ({
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
      if ("categories" in result && Array.isArray((result as any).categories)) {
        (result as any).categories.forEach((cat: any, catIndex: number) => {
          if ("steps" in cat && Array.isArray(cat.steps)) {
            cat.steps.forEach((step: string, stepIndex: number) => {
              steps.push({
                stepId: `categories.${catIndex}.steps.${stepIndex}`,
                label: `[${cat.name || "Category"}] ${step}`,
              });
            });
          }
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
      const pillars = ["love", "goodAt", "worldNeeds", "paidFor", "purpose"];
      pillars.forEach((pillar, idx) => {
        if (pillar in result && typeof (result as any)[pillar] === "string") {
          steps.push({ stepId: `pillar.${idx}`, label: `[${pillar.toUpperCase()}] ${(result as any)[pillar]}` });
        }
      });
      break;
    }
    default:
      return [];
  }
  return steps;
}
