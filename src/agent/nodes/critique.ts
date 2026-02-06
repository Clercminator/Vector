import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts } from "../prompts";
import { invokeWithFallback } from "../utils";

export const critiqueNode = async (state: AgentStateType) => {
    const { blueprint, framework, critiqueAttempts } = state;
    if (critiqueAttempts > 0) return { critiqueAttempts: 1 };
    if (!blueprint) return { critiqueAttempts: 1 };

    const specificRubric = prompts.critiqueRubrics[framework || 'default'] || prompts.critiqueRubrics['default'];

    const prompt = prompts.critique
        .replace("{{framework}}", framework || "")
        .replace("{{blueprint}}", JSON.stringify(blueprint))
        .replace("{{rubric}}", specificRubric);
    
    const response = await invokeWithFallback([new SystemMessage(prompt)], { temperature: 0.3, bindTools: false });
    const result = response.content.toString().trim();
    
    if (result === "PASS") return { critiqueAttempts: 0 }; // No increment
    return { critiqueAttempts: 1, messages: [new HumanMessage(`The previous blueprint was rejected. Fix: ${result}`)] }; // Treat as human feedback for the draft node
};
