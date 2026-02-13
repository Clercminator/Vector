import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts, frameworkContexts } from "../prompts";
import { frameworkGuides } from "@/lib/prompts/frameworkGuides";
import { commonGoalsAndPatterns } from "@/lib/prompts/commonGoalsAndPatterns";
import { invokeWithFallback } from "../utils";
import { MESSAGE_WINDOW_SIZE, getEmptyMessageReply, MAX_USER_MESSAGE_CHARS, getLongMessageReply } from "../constants";

export const askNode = async (state: AgentStateType) => {
  const { goal, framework, messages, steps, language } = state;
  if (!framework) return {};

  const lastMsg = messages?.length ? messages[messages.length - 1] : null;
  if (lastMsg instanceof HumanMessage) {
    const text = typeof lastMsg.content === "string" ? lastMsg.content : String(lastMsg.content ?? "");
    if (!text.trim()) {
      return { messages: [new AIMessage(getEmptyMessageReply(language))], steps: 0 };
    }
    if (text.length > MAX_USER_MESSAGE_CHARS) {
      return { messages: [new AIMessage(getLongMessageReply(language))], steps: 0 };
    }
  }

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
        .replace('{{frameworkGuide}}', frameworkGuides[framework] || "")
        .replace('{{commonGoalsPatterns}}', commonGoalsAndPatterns)
        .replace('{{goal}}', goal)
        .replace('{{steps}}', steps.toString())
        .replace('{{toneInstructions}}', toneInstructions);

  const sysMsg = new SystemMessage(systemPrompt);

  // Filter messages to avoid duplicate system prompts or confusion with consultant phase
  // We keep history but ensure the latest system prompt is dominant.
  const windowedMessages = messages.slice(-MESSAGE_WINDOW_SIZE);
  const response = await invokeWithFallback([sysMsg, ...windowedMessages], { bindTools: true });
  return { messages: [response], steps: 1 };
};
