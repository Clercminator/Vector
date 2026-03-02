import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts } from "../prompts";
import { invokeWithFallback } from "../utils";
import { DRAFT_HISTORY_MAX_CHARS } from "../constants";

export const draftNode = async (state: AgentStateType) => {
  const { goal, framework, messages, tier, validFrameworks, userProfile = "", formContext = "" } = state;

  const isLocked = !validFrameworks.includes(framework || "");

  let history = messages.map(m => m.content).join("\n");
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

  const extractAndParse = (rawContent: string): object | null => {
    const jsonBlock = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    const rawJson = jsonBlock ? jsonBlock[1].trim() : rawContent;
    const braceMatch = rawJson.match(/\{[\s\S]*\}/);
    const toParse = braceMatch ? braceMatch[0] : rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      const parsed = JSON.parse(toParse);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  let response = await invokeWithFallback([new SystemMessage(prompt)], { temperature: 0.2, bindTools: false });
  let content = response.content.toString().trim();
  let blueprint = extractAndParse(content);
  if (!blueprint) {
    const JSON_ONLY_NUDGE = "\n\nCRITICAL: Output ONLY valid JSON. No markdown, no code fence, no preamble or explanation.";
    response = await invokeWithFallback([new SystemMessage(prompt + JSON_ONLY_NUDGE)], { temperature: 0.1, bindTools: false });
    content = response.content.toString().trim();
    blueprint = extractAndParse(content);
  }

  if (!blueprint) {
    return { messages: [new AIMessage("Error generating blueprint. Please try again.")] };
  }

  try {
    const fw = framework || (blueprint.type as string) || "";
    if (fw) blueprint.type = fw;

    if (blueprint.type === "rpm") {
      blueprint = {
        ...blueprint,
        result: typeof blueprint.result === "string" ? blueprint.result : (blueprint.result != null ? String(blueprint.result) : ""),
        purpose: typeof blueprint.purpose === "string" ? blueprint.purpose : (blueprint.purpose != null ? String(blueprint.purpose) : ""),
        plan: Array.isArray(blueprint.plan)
          ? blueprint.plan.filter(Boolean).map((s: unknown) => (typeof s === "string" ? s : String(s)))
          : typeof blueprint.plan === "string" && blueprint.plan.trim()
            ? [blueprint.plan.trim()]
            : [],
      };
      if (!blueprint.plan.length) {
        blueprint.plan = ["(Add your first action step.)"];
      }
    }

    if (blueprint.type === "eisenhower") {
      const toStrArray = (v: unknown): string[] => {
        if (Array.isArray(v)) return v.filter(Boolean).map((s: unknown) => (typeof s === "string" ? s : String(s)));
        if (typeof v === "string" && v.trim()) return v.split(/[,;]|\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
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

    const frameworkLabel = framework ? String(framework).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    const closingMessage = frameworkLabel
      ? `Your ${frameworkLabel} blueprint is ready below. Review your personalized plan and refine as needed.`
      : "Your blueprint is ready below. Review your personalized plan and refine as needed.";
    return { blueprint, messages: [new AIMessage(closingMessage)] };
  } catch {
    return { messages: [new AIMessage("Error generating blueprint. Please try again.")] };
  }
};
