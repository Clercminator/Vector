import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { frameworkContexts } from "../prompts";

const KNOWN_FRAMEWORKS = new Set(Object.keys(frameworkContexts));

export const frameworkSetterNode = async (state: AgentStateType) => {
    const lastMsg = state.messages[state.messages.length - 1] as AIMessage;
    const toolCall = lastMsg.tool_calls?.find(tc => tc.name === 'set_framework');

    if (!toolCall) return {};

    const framework = toolCall.args?.framework;
    if (!KNOWN_FRAMEWORKS.has(framework)) {
        const toolMsg = new ToolMessage({
            tool_call_id: toolCall.id!,
            content: `Unknown framework "${framework}". Please choose from: ${[...KNOWN_FRAMEWORKS].join(", ")}.`,
            name: "set_framework",
        });
        return { messages: [toolMsg] };
    }

    const toolMsg = new ToolMessage({
        tool_call_id: toolCall.id!,
        content: `Switched to ${framework}`,
        name: "set_framework",
    });
    return {
        framework,
        messages: [toolMsg],
        steps: 1,
    };
};
