import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { MAX_VALIDATION_ATTEMPTS } from "../constants";
import { invokeWithFallback } from "../utils";

const DRAFT_BLOCK_REGEX = /\|\|\|DRAFT_START\|\|\|([\s\S]*?)\|\|\|DRAFT_END\|\|\|/;

/** Minimum user messages before allowing request_confirmation (depth check fallback). */
const MIN_USER_MESSAGES_BEFORE_DRAFT = 3;

/** LLM-based sufficiency check: do we have enough personalized info for a non-generic plan? */
async function checkSufficiencyForPlan(
    goal: string,
    framework: string,
    convSummary: string,
    language: string
): Promise<{ sufficient: boolean; suggestion?: string }> {
    try {
        const prompt = `You are a validator. Given the goal, framework, and conversation summary below, decide if we have ENOUGH PERSONALIZED information to create a non-generic, tailored plan.

Goal: ${goal}
Framework: ${framework}
Conversation (last 1500 chars): ${convSummary.slice(-1500)}

Consider: For ANY goal type, we need user-specific details (constraints, numbers, preferences, past experience). For fitness/health goals: body/constraints, habits, lifestyle, past failures. For learning goals: current level, time available, learning style. Use natural reasoning—no hardcoded fields.

Reply with JSON only: {"sufficient": true|false, "suggestion": "one specific question to ask if insufficient (omit if sufficient)"}
Language for suggestion: ${language}`;

        const response = await invokeWithFallback(
            [new SystemMessage(prompt)],
            { temperature: 0, bindTools: false }
        );
        const text = response.content.toString().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { sufficient: true };
        const parsed = JSON.parse(jsonMatch[0]) as { sufficient?: boolean; suggestion?: string };
        return {
            sufficient: parsed.sufficient === true,
            suggestion: typeof parsed.suggestion === "string" ? parsed.suggestion : undefined,
        };
    } catch {
        return { sufficient: true };
    }
}

export const validatorNode = async (state: AgentStateType) => {
    const { messages, validationAttempts, framework, goal, language } = state;
    if (!messages?.length) return { validationAttempts: 0 };

    const lastMsg = messages[messages.length - 1];
    const isAIMessage = lastMsg instanceof AIMessage;

    if (!isAIMessage) return { validationAttempts: 0 };

    const content = lastMsg.content.toString();

    const hasRequestConfirmation = (lastMsg as AIMessage).tool_calls?.some(
        (tc: { name?: string }) => tc.name === "request_confirmation"
    );
    if (hasRequestConfirmation && framework) {
        const userMessageCount = messages.filter(
            (m) => m instanceof HumanMessage && !m.content.toString().includes("SYSTEM ERROR")
        ).length;
        if (userMessageCount < MIN_USER_MESSAGES_BEFORE_DRAFT) {
            return {
                validationAttempts: validationAttempts + 1,
                messages: [
                    new HumanMessage(
                        `SYSTEM ERROR: Insufficient personalization data. Ask the user at least 3–4 more questions (e.g., constraints, typical day, what's held them back before) before requesting confirmation. Do NOT call request_confirmation yet.`
                    ),
                ],
            };
        }
        const convSummary = messages.map((m) => m.content.toString()).join("\n");
        const { sufficient, suggestion } = await checkSufficiencyForPlan(
            goal || "",
            framework,
            convSummary,
            language || "en"
        );
        if (!sufficient && suggestion) {
            return {
                validationAttempts: validationAttempts + 1,
                messages: [
                    new HumanMessage(
                        `SYSTEM ERROR: Not yet enough personalized information for a non-generic plan. Ask the user: "${suggestion}" Then summarize and ask for confirmation. Do NOT call request_confirmation until you have this.`
                    ),
                ],
            };
        }
    }

    // Malformed block: DRAFT_START without matching DRAFT_END — treat as invalid
    const hasUnclosedDraftStart = /^\|\|\|DRAFT_START\|\|\|/.test(content.trim()) || content.includes("|||DRAFT_START|||");
    const hasValidBlock = DRAFT_BLOCK_REGEX.test(content);
    if (hasUnclosedDraftStart && !hasValidBlock) {
        const fw = framework ? ` for the "${framework}" framework` : "";
        return {
            validationAttempts: validationAttempts + 1,
            messages: [new HumanMessage(`SYSTEM ERROR: The "Rough Draft" block was incomplete (missing |||DRAFT_END|||). Please REWRITE your message with a complete JSON block${fw}.`)],
        };
    }

    // Safety check: ensure we don't loop forever
    if (validationAttempts >= MAX_VALIDATION_ATTEMPTS) {
         const cleanContent = content.replace(/\|\|\|DRAFT_START\|\|\|[\s\S]*?\|\|\|DRAFT_END\|\|\|/, '').trim();
         const cleanedMessage = new AIMessage({
             content: cleanContent || "(Draft block removed due to validation errors.)",
             id: (lastMsg as { id?: string }).id,
         });
         return { validationAttempts: 0, messages: [cleanedMessage] };
    }

    const draftMatch = content.match(DRAFT_BLOCK_REGEX);
    
    if (draftMatch) {
        try {
            const parsed = JSON.parse(draftMatch[1].trim());
            
            // Schema Validation
            if (framework) {
                const requiredKeys: Record<string, string[]> = {
                    'pareto': ['vital', 'trivial'],
                    'eisenhower': ['q1', 'q2', 'q3', 'q4'],
                    'first-principles': ['truths', 'newApproach'],
                    'okr': ['objective', 'keyResults', 'initiative'],
                    'rpm': ['result', 'purpose', 'plan'],
                    'misogi': ['challenge', 'gap', 'purification'],
                    'dsss': ['deconstruct', 'selection', 'sequence', 'stakes', 'objective'],
                    'mandalas': ['centralGoal', 'categories'],
                    'ikigai': ['love', 'goodAt', 'worldNeeds', 'paidFor', 'purpose'],
                    'general': ['steps']
                };
                
                const expected = requiredKeys[framework];
                if (expected) {
                    const keys = Object.keys(parsed);
                    const invalidKeys = keys.filter(k => !expected.includes(k) && k !== 'type'); // Allow 'type' if present
                    // Logic: We don't strictly require ALL keys yet (as it's partial), but we MUST forbid invented keys
                    
                    if (invalidKeys.length > 0) {
                         throw new Error(`Unknown properties detected: ${invalidKeys.join(", ")}. Only allowed keys for ${framework} are: ${expected.join(", ")}.`);
                    }
                }
            }

            // Valid JSON & Schema
            return { validationAttempts: 0 };
        } catch (e: any) {
            // Invalid JSON or Schema
            console.error("Validator caught bad Data:", e);
            return { 
                validationAttempts: validationAttempts + 1,
                messages: [new HumanMessage(`SYSTEM ERROR: The "Rough Draft" JSON block was invalid. Error: ${e.message}. \n\nPlease REWRITE your previous message with CORRECT JSON structure for the "${framework}" framework.`)]
            };
        }
    }
    
    return { validationAttempts: 0 };
};
