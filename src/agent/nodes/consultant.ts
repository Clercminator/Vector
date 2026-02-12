import { SystemMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts, frameworkContexts } from "../prompts";
import { invokeWithFallback } from "../utils";

export const consultantNode = async (state: AgentStateType) => {
    const { goal, tier, validFrameworks, messages, language } = state;
    
    // Replace placeholders in the prompt
    let promptText = prompts.consultant
        .replace("{{goal}}", goal)
        .replace("{{tier}}", tier)
        .replace("{{valid_frameworks}}", validFrameworks.join(", "))
        .replace("{{all_frameworks}}", Object.keys(frameworkContexts).join(", "));
        
    const systemPrompt = prompts.consultantSystem.replace(/{{language}}/g, language);
        
    const combinedPrompt = `${promptText}\n\n${systemPrompt}`;
    const sysMsg = new SystemMessage(combinedPrompt);
    
    // Filter out previous system messages to keep context clean
    const recentMessages = messages.filter(m => !(m instanceof SystemMessage));
    const windowedMessages = recentMessages.slice(-20); // Keep last 20 messages max
    
    const response = await invokeWithFallback([sysMsg, ...windowedMessages], { bindTools: true });
    return { messages: [response] };
};
