import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { prompts } from "../prompts";
import { invokeWithFallback } from "../utils";
import { agentLogger, promptCharsFromString } from "../logger";

export const critiqueNode = async (state: AgentStateType) => {
    const { blueprint, framework, critiqueAttempts } = state;
    if (critiqueAttempts > 0) return { critiqueAttempts: 1 };
    if (!blueprint) return { critiqueAttempts: 1 };

    const specificRubric = prompts.critiqueRubrics[framework || 'default'] || prompts.critiqueRubrics['default'];

    const prompt = prompts.critique
        .replace("{{framework}}", framework || "")
        .replace("{{blueprint}}", JSON.stringify(blueprint))
        .replace("{{rubric}}", specificRubric);

    const start = performance.now();
    try {
        const response = await invokeWithFallback([new SystemMessage(prompt)], { temperature: 0.3, bindTools: false });
        const result = response.content.toString().trim();
        agentLogger.logNode({ node: "critique", promptChars: promptCharsFromString(prompt), latencyMs: Math.round(performance.now() - start), success: true });
        if (result === "PASS") return { critiqueAttempts: 0 };
        return { critiqueAttempts: 1, messages: [new HumanMessage(`The previous blueprint was rejected. Fix: ${result}`)] };
    } catch (e) {
        agentLogger.logNode({ node: "critique", promptChars: promptCharsFromString(prompt), latencyMs: Math.round(performance.now() - start), success: false, error: e instanceof Error ? e.message : String(e) });
        throw e;
    }
};
