import { SystemMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts, frameworkContexts } from "../prompts";
import { invokeWithFallback } from "../goalAgent"; // We will update goalAgent to export this or move it to a utils file. 
// Ideally invokeWithFallback should be in a utils file. For now I will import from goalAgent and fix circular dep later or move it now.
// Actually, moving invokeWithFallback to a separate file 'utils.ts' is safer to avoid circular deps.

export const consultantNode = async (state: AgentStateType) => {
    const { goal, tier, validFrameworks, messages, language } = state;
    
    // Replace placeholders in the prompt
    let promptText = prompts.consultant
        .replace("{{goal}}", goal)
        .replace("{{tier}}", tier)
        .replace("{{valid_frameworks}}", validFrameworks.join(", "))
        .replace("{{all_frameworks}}", Object.keys(frameworkContexts).join(", "));
        
    const systemPrompt = prompts.consultantSystem.replace(/{{language}}/g, language);
        
    const sysMsg = new SystemMessage(promptText);
    const langMsg = new SystemMessage(systemPrompt);
    
    // Filter out previous system messages to keep context clean
    const recentMessages = messages.filter(m => !(m instanceof SystemMessage));
    const windowedMessages = recentMessages.slice(-20); // Keep last 20 messages max
    
    // We need invokeWithFallback. Since I haven't moved it yet, I'll temporarily import from a new utils file I should create.
    const { invokeWithFallback } = await import("../utils"); 
    
    const response = await invokeWithFallback([sysMsg, langMsg, ...windowedMessages], { bindTools: true });
    return { messages: [response] };
};
