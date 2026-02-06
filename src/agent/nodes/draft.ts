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
    const blueprint = JSON.parse(toParse);
    return { blueprint, messages: [new AIMessage("Here is your strategic blueprint.")] };
  } catch (e) {
    return { messages: [new AIMessage("Error generating blueprint. Please try again.")] };
  }
};
