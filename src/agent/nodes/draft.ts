import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts } from "../prompts";
import {
  FINAL_PLAN_MODELS,
  FINAL_PLAN_REASONING,
  invokeWithFallback,
} from "../utils";
import { DRAFT_HISTORY_MAX_CHARS } from "../constants";
import { agentLogger, promptCharsFromString } from "../logger";
import {
  formatPlanValidationErrors,
  normalizeCanonicalPlanResult,
  validateCanonicalPlanResult,
} from "@/lib/planContract";

export const draftNode = async (state: AgentStateType) => {
  const {
    goal,
    framework,
    messages,
    tier,
    validFrameworks,
    userProfile = "",
    formContext = "",
    userReviewFeedback = "",
  } = state;

  const isLocked = !validFrameworks.includes(framework || "");

  let history = messages.map((m) => m.content).join("\n");
  if (userReviewFeedback) {
    history += `\n\nCRITICAL – User-perspective refinement requested. Incorporate these changes into the blueprint:\n${userReviewFeedback}`;
  }
  if (history.length > DRAFT_HISTORY_MAX_CHARS) {
    history = history.slice(-DRAFT_HISTORY_MAX_CHARS);
  }

  let prompt = "";

  if (isLocked) {
    prompt = prompts.draftLocked
      .replace("{{framework}}", framework || "")
      .replace("{{goal}}", goal)
      .replace("{{history}}", history)
      .replace("{{userProfile}}", userProfile || "(none)")
      .replace("{{formContext}}", formContext || "(none)");
  } else {
    prompt = prompts.draftFull
      .replace("{{framework}}", framework || "")
      .replace("{{goal}}", goal)
      .replace("{{history}}", history)
      .replace("{{userProfile}}", userProfile || "(none)")
      .replace("{{formContext}}", formContext || "(none)");
  }

  const start = performance.now();
  const finalPlanInvokeOptions = {
    temperature: 0.15,
    bindTools: false,
    models: FINAL_PLAN_MODELS,
    maxTokens: 3600,
    modelKwargs: {
      reasoning: FINAL_PLAN_REASONING,
    },
  } as const;

  const extractAndParse = (
    rawContent: string,
  ): Record<string, unknown> | null => {
    const jsonBlock = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    const rawJson = jsonBlock ? jsonBlock[1].trim() : rawContent;
    const braceMatch = rawJson.match(/\{[\s\S]*\}/);
    const toParse = braceMatch
      ? braceMatch[0]
      : rawJson
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
    try {
      const parsed = JSON.parse(toParse);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const toStrArray = (v: unknown): string[] => {
    if (Array.isArray(v))
      return v
        .map((s: unknown) =>
          typeof s === "string" ? s : s != null ? String(s) : "",
        )
        .filter(Boolean);
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return [];
  };
  const toStr = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;

  /** Ensures every framework has safe shapes so UI/PDF never see undefined or empty required fields. */
  function normalizeBlueprintForFramework(bp: Record<string, unknown>): void {
    const t = (bp.type as string) || "";
    if (t === "pareto") {
      bp.vital = toStrArray(bp.vital).length
        ? toStrArray(bp.vital)
        : ["(Add vital priority)"];
      bp.trivial = toStrArray(bp.trivial).length
        ? toStrArray(bp.trivial)
        : ["(Add trivial to avoid)"];
    } else if (t === "first-principles") {
      bp.truths = toStrArray(bp.truths).length
        ? toStrArray(bp.truths)
        : ["(Add a key truth)"];
      bp.newApproach = toStr(bp.newApproach, "(Add your new approach)");
    } else if (t === "okr") {
      bp.objective = toStr(bp.objective, "(Your objective)");
      bp.keyResults = toStrArray(bp.keyResults).length
        ? toStrArray(bp.keyResults)
        : ["(Key result 1)"];
      bp.initiative = toStr(bp.initiative, "(Main initiative)");
    } else if (t === "general") {
      bp.steps = toStrArray(bp.steps).length
        ? toStrArray(bp.steps)
        : ["(Add your first step)"];
    } else if (t === "dsss") {
      bp.deconstruct = toStrArray(bp.deconstruct).length
        ? toStrArray(bp.deconstruct)
        : ["(Subskill 1)"];
      bp.selection = toStrArray(bp.selection).length
        ? toStrArray(bp.selection)
        : ["(20% to focus on)"];
      bp.sequence = toStrArray(bp.sequence).length
        ? toStrArray(bp.sequence)
        : ["(Step 1)"];
      bp.stakes = toStr(bp.stakes, "(Accountability commitment)");
    } else if (t === "misogi") {
      bp.challenge = toStr(bp.challenge, "(Your challenge)");
      bp.gap = toStr(bp.gap, "(Gap to close)");
      bp.purification = toStr(bp.purification, "(Purification steps)");
    } else if (t === "ikigai") {
      bp.love = toStr(bp.love, "(What you love)");
      bp.goodAt = toStr(bp.goodAt, "(What you're good at)");
      bp.worldNeeds = toStr(bp.worldNeeds, "(What the world needs)");
      bp.paidFor = toStr(bp.paidFor, "(What you can be paid for)");
      bp.purpose = toStr(bp.purpose, "(Your ikigai)");
    }
  }

  try {
    const JSON_ONLY_NUDGE =
      "\n\nCRITICAL: Output ONLY valid JSON. No markdown, no code fence, no preamble or explanation.";
    let response = await invokeWithFallback(
      [new SystemMessage(prompt)],
      finalPlanInvokeOptions,
    );
    let content = response.content.toString().trim();
    let blueprint = extractAndParse(content);
    if (!blueprint) {
      response = await invokeWithFallback(
        [new SystemMessage(prompt + JSON_ONLY_NUDGE)],
        { ...finalPlanInvokeOptions, temperature: 0.1 },
      );
      content = response.content.toString().trim();
      blueprint = extractAndParse(content);
    }

    if (!blueprint) {
      agentLogger.logNode({
        node: "draft",
        promptChars: promptCharsFromString(prompt),
        latencyMs: Math.round(performance.now() - start),
        success: false,
        error: "Failed to parse blueprint",
      });
      return {
        messages: [
          new AIMessage("Error generating blueprint. Please try again."),
        ],
      };
    }
    agentLogger.logNode({
      node: "draft",
      promptChars: promptCharsFromString(prompt),
      latencyMs: Math.round(performance.now() - start),
      success: true,
    });

    const fw = framework || (blueprint.type as string) || "";
    if (fw) blueprint.type = fw;

    if (blueprint.type === "rpm") {
      const rpmPlan = Array.isArray(blueprint.plan)
        ? blueprint.plan
            .filter(Boolean)
            .map((s: unknown) => (typeof s === "string" ? s : String(s)))
        : typeof blueprint.plan === "string" && blueprint.plan.trim()
          ? [blueprint.plan.trim()]
          : [];

      blueprint = {
        ...blueprint,
        result:
          typeof blueprint.result === "string"
            ? blueprint.result
            : blueprint.result != null
              ? String(blueprint.result)
              : "",
        purpose:
          typeof blueprint.purpose === "string"
            ? blueprint.purpose
            : blueprint.purpose != null
              ? String(blueprint.purpose)
              : "",
        plan: rpmPlan,
      };
      if (rpmPlan.length === 0) {
        blueprint.plan = ["(Add your first action step.)"];
      }
    }

    if (blueprint.type === "eisenhower") {
      const toStrArray = (v: unknown): string[] => {
        if (Array.isArray(v))
          return v
            .filter(Boolean)
            .map((s: unknown) => (typeof s === "string" ? s : String(s)));
        if (typeof v === "string" && v.trim())
          return v
            .split(/[,;]|\s+and\s+/i)
            .map((s) => s.trim())
            .filter(Boolean);
        return [];
      };
      blueprint = {
        ...blueprint,
        q1: toStrArray(blueprint.q1),
        q2: toStrArray(blueprint.q2),
        q3: toStrArray(blueprint.q3),
        q4: toStrArray(blueprint.q4),
      };
    }

    if (blueprint.type === "gps") {
      const toStrArray = (v: unknown): string[] => {
        if (Array.isArray(v))
          return v
            .filter(Boolean)
            .map((s: unknown) => (typeof s === "string" ? s : String(s)));
        if (typeof v === "string" && v.trim()) return [v.trim()];
        return [];
      };
      const goalStr =
        typeof blueprint.goal === "string" && blueprint.goal.trim()
          ? blueprint.goal.trim()
          : "Your clear outcome (edit to refine)";
      const planArr = toStrArray(blueprint.plan);
      const systemArr = toStrArray(blueprint.system);
      const antiArr = toStrArray(blueprint.anti_goals);
      blueprint = {
        ...blueprint,
        goal: goalStr,
        plan: planArr.length > 0 ? planArr : ["(Add your first major move.)"],
        system:
          systemArr.length > 0
            ? systemArr
            : ["(Add your first system habit or trigger.)"],
        anti_goals: antiArr,
      };
    }

    if (blueprint.type === "mandalas") {
      const centralGoalStr =
        typeof blueprint.centralGoal === "string" &&
        blueprint.centralGoal.trim()
          ? blueprint.centralGoal.trim()
          : typeof blueprint.central_goal === "string" &&
              blueprint.central_goal.trim()
            ? blueprint.central_goal.trim()
            : "Your central goal (edit to refine)";
      const rawCats = Array.isArray(blueprint.categories)
        ? blueprint.categories
        : [];
      const padSteps = (steps: unknown): string[] => {
        const arr = Array.isArray(steps)
          ? steps.map((s: unknown) =>
              typeof s === "string" ? s : s != null ? String(s) : "",
            )
          : [];
        return Array.from({ length: 8 }, (_, i) => (arr[i] ?? "").trim() || "");
      };
      const categories = Array.from({ length: 8 }, (_, i) => {
        const raw =
          rawCats[i] && typeof rawCats[i] === "object"
            ? (rawCats[i] as Record<string, unknown>)
            : {};
        const name =
          typeof raw.name === "string" && raw.name.trim()
            ? raw.name.trim()
            : "";
        const steps = padSteps(raw.steps);
        return {
          name,
          steps,
          ...(raw.why != null && { why: String(raw.why) }),
          ...(raw.stepWhys != null && { stepWhys: raw.stepWhys }),
        };
      });
      blueprint = {
        ...blueprint,
        centralGoal: centralGoalStr,
        categories,
      };
    }

    // Ensure every framework has safe shapes so UI/PDF never see undefined or empty required fields.
    normalizeBlueprintForFramework(blueprint);

    blueprint = normalizeCanonicalPlanResult(
      blueprint,
      String(blueprint.type || framework || "general"),
      {
        goal,
        title: goal,
      },
    );

    let validation = validateCanonicalPlanResult(
      blueprint,
      String(blueprint.type || framework || "general"),
    );
    if (!validation.isValid) {
      const repairPrompt = `${prompt}${JSON_ONLY_NUDGE}\n\nCRITICAL VALIDATION FAILURES TO FIX BEFORE RETURNING JSON:\n${formatPlanValidationErrors(validation.errors)}`;
      response = await invokeWithFallback([new SystemMessage(repairPrompt)], {
        ...finalPlanInvokeOptions,
        temperature: 0.1,
      });
      content = response.content.toString().trim();
      const repaired = extractAndParse(content);
      if (repaired) {
        normalizeBlueprintForFramework(repaired);
        blueprint = normalizeCanonicalPlanResult(
          repaired,
          String(repaired.type || framework || "general"),
          {
            goal,
            title: goal,
          },
        );
        validation = validateCanonicalPlanResult(
          blueprint,
          String(blueprint.type || framework || "general"),
        );
      }
    }

    if (!validation.isValid) {
      agentLogger.logNode({
        node: "draft",
        promptChars: promptCharsFromString(prompt),
        latencyMs: Math.round(performance.now() - start),
        success: false,
        error: validation.errors.join("; "),
      });
      return {
        messages: [
          new AIMessage(
            "The plan is still too weak to deliver. Please answer a few more specifics so I can generate a tracker-ready plan.",
          ),
        ],
      };
    }

    const frameworkLabel = framework
      ? String(framework)
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "";
    const closingMessage = frameworkLabel
      ? `Your ${frameworkLabel} blueprint is ready below. Review your personalized plan and refine as needed.`
      : "Your blueprint is ready below. Review your personalized plan and refine as needed.";
    return { blueprint, messages: [new AIMessage(closingMessage)] };
  } catch (e) {
    agentLogger.logNode({
      node: "draft",
      promptChars: promptCharsFromString(prompt),
      latencyMs: Math.round(performance.now() - start),
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
    return {
      messages: [
        new AIMessage("Error generating blueprint. Please try again."),
      ],
    };
  }
};
