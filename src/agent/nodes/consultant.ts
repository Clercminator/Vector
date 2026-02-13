import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts, frameworkContexts } from "../prompts";
import { frameworkGuideForConsultant } from "@/lib/prompts/frameworkGuides";
import { commonGoalsAndPatterns } from "@/lib/prompts/commonGoalsAndPatterns";
import { invokeWithFallback } from "../utils";
import { MESSAGE_WINDOW_SIZE, getEmptyMessageReply, MAX_USER_MESSAGE_CHARS, getLongMessageReply } from "../constants";

export const consultantNode = async (state: AgentStateType) => {
    const { goal, tier, validFrameworks, messages, language } = state;

    const lastMsg = messages?.length ? messages[messages.length - 1] : null;
    if (lastMsg instanceof HumanMessage) {
        const text = typeof lastMsg.content === "string" ? lastMsg.content : String(lastMsg.content ?? "");
        if (!text.trim()) {
            return { messages: [new AIMessage(getEmptyMessageReply(language))] };
        }
        if (text.length > MAX_USER_MESSAGE_CHARS) {
            return { messages: [new AIMessage(getLongMessageReply(language))] };
        }
    }

    // Replace placeholders in the prompt
    let promptText = prompts.consultant
        .replace("{{goal}}", goal)
        .replace("{{tier}}", tier)
        .replace("{{valid_frameworks}}", validFrameworks.join(", "))
        .replace("{{all_frameworks}}", Object.keys(frameworkContexts).join(", "))
        .replace("{{framework_guide}}", frameworkGuideForConsultant)
        .replace("{{common_goals_patterns}}", commonGoalsAndPatterns);
        
    const systemPrompt = prompts.consultantSystem.replace(/{{language}}/g, language);
        
    const combinedPrompt = `${promptText}\n\n${systemPrompt}`;
    const sysMsg = new SystemMessage(combinedPrompt);
    
    // Filter out previous system messages to keep context clean
    const recentMessages = messages.filter(m => !(m instanceof SystemMessage));
    const windowedMessages = recentMessages.slice(-MESSAGE_WINDOW_SIZE);
    
    const response = await invokeWithFallback([sysMsg, ...windowedMessages], { bindTools: true });
    return { messages: [response] };
};
