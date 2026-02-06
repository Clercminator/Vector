import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";

export const frameworkSetterNode = async (state: AgentStateType) => {
    const lastMsg = state.messages[state.messages.length - 1] as AIMessage;
    const toolCall = lastMsg.tool_calls?.find(tc => tc.name === 'set_framework');
    
    if (toolCall) {
        const framework = toolCall.args.framework;
        
        // Manually create the ToolMessage
        const toolMsg = new ToolMessage({
            tool_call_id: toolCall.id!,
            content: `Switched to ${framework}`,
            name: 'set_framework'
        });
        
        // Return state update: Set framework, add tool output, and reset steps
        return { 
            framework: framework,
            messages: [toolMsg],
            steps: 1 
        };
    }
    return { }; 
};
