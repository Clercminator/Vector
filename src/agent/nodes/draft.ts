import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts } from "../prompts";
import { invokeWithFallback } from "../utils";

export const draftNode = async (state: AgentStateType) => {
  const { goal, framework, messages, tier, validFrameworks } = state;
  
  // Check if locked
  const isLocked = !validFrameworks.includes(framework || "");

  let prompt = "";
  const history = messages.map(m => m.content).join('\n'); // Simplify history for prompt injection

  if (isLocked) {
      prompt = prompts.draftLocked
          .replace("{{framework}}", framework || "")
          .replace("{{goal}}", goal)
          .replace("{{history}}", history);
  } else {
      prompt = prompts.draftFull
          .replace("{{framework}}", framework || "")
          .replace("{{goal}}", goal)
          .replace("{{history}}", history);
  }

  const response = await invokeWithFallback([new SystemMessage(prompt)], { temperature: 0.2, bindTools: false });
  let content = response.content.toString().trim();

  // Extract JSON robustly: model may return markdown, preamble text, or only JSON
  const jsonBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const rawJson = jsonBlock ? jsonBlock[1].trim() : content;
  const braceMatch = rawJson.match(/\{[\s\S]*\}/);
  const toParse = braceMatch ? braceMatch[0] : rawJson.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    let blueprint = JSON.parse(toParse);

    // Normalize so UI always has valid shape; ensure RPM plan is always an array
    if (blueprint && blueprint.type === 'rpm') {
      blueprint = {
        ...blueprint,
        result: typeof blueprint.result === 'string' ? blueprint.result : (blueprint.result != null ? String(blueprint.result) : ''),
        purpose: typeof blueprint.purpose === 'string' ? blueprint.purpose : (blueprint.purpose != null ? String(blueprint.purpose) : ''),
        plan: Array.isArray(blueprint.plan)
          ? blueprint.plan.filter(Boolean).map((s: unknown) => typeof s === 'string' ? s : String(s))
          : typeof blueprint.plan === 'string' && blueprint.plan.trim()
            ? [blueprint.plan.trim()]
            : [],
      };
    }

    const frameworkLabel = framework ? String(framework).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    const closingMessage = frameworkLabel
      ? `Your ${frameworkLabel} blueprint is ready below. Review your personalized plan and refine as needed.`
      : "Your blueprint is ready below. Review your personalized plan and refine as needed.";
    return { blueprint, messages: [new AIMessage(closingMessage)] };
  } catch (e) {
    return { messages: [new AIMessage("Error generating blueprint. Please try again.")] };
  }
};
