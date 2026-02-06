import { SystemMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts, frameworkContexts } from "../prompts";
import { invokeWithFallback } from "../utils";

export const askNode = async (state: AgentStateType) => {
  const { goal, framework, messages, steps, language } = state;
  if (!framework) return {}; // Safety

  let toneInstructions = prompts.askDefaultTone;
  if (steps >= 5) toneInstructions = prompts.askConciseTone;
  if (steps >= 8) toneInstructions = prompts.askUrgentTone;

  // Devil's Advocate Injection
  let personaInstruction = prompts.askPersonaBase.replace('{{framework}}', framework);
  if (state.hardMode) {
      personaInstruction = prompts.askPersonaDevil.replace('{{framework}}', framework);
  }

  const systemPrompt = prompts.askSystem
        .replace('{{personaInstruction}}', personaInstruction)
        .replace(/{{language}}/g, language)
        .replace('{{frameworkContext}}', frameworkContexts[framework] || "")
        .replace('{{goal}}', goal)
        .replace('{{steps}}', steps.toString())
        .replace('{{toneInstructions}}', toneInstructions);

  const sysMsg = new SystemMessage(systemPrompt);

  // Filter messages to avoid duplicate system prompts or confusion with consultant phase
  // We keep history but ensure the latest system prompt is dominant.
  const windowedMessages = messages.slice(-20); // Keep last 20 messages max
  const response = await invokeWithFallback([sysMsg, ...windowedMessages], { bindTools: true });
  return { messages: [response], steps: 1 };
};
