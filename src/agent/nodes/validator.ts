import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";
import { MAX_VALIDATION_ATTEMPTS } from "../constants";

const DRAFT_BLOCK_REGEX = /\|\|\|DRAFT_START\|\|\|([\s\S]*?)\|\|\|DRAFT_END\|\|\|/;

/** Minimum user messages before allowing generate_blueprint (depth check). */
const MIN_USER_MESSAGES_BEFORE_DRAFT = 3;

export const validatorNode = async (state: AgentStateType) => {
    const { messages, validationAttempts, framework } = state;
    if (!messages?.length) return { validationAttempts: 0 };

    const lastMsg = messages[messages.length - 1];
    const isAIMessage = lastMsg instanceof AIMessage;

    // Only validate and replace when last message is from the AI
    if (!isAIMessage) return { validationAttempts: 0 };

    const content = lastMsg.content.toString();

    // Depth check: if about to generate blueprint, ensure sufficient personalization
    const hasGenerateBlueprint = (lastMsg as AIMessage).tool_calls?.some(
        (tc: { name?: string }) => tc.name === "generate_blueprint"
    );
    if (hasGenerateBlueprint && framework) {
        const userMessageCount = messages.filter(
            (m) => m instanceof HumanMessage && !m.content.toString().includes("SYSTEM ERROR")
        ).length;
        if (userMessageCount < MIN_USER_MESSAGES_BEFORE_DRAFT) {
            return {
                validationAttempts: validationAttempts + 1,
                messages: [
                    new HumanMessage(
                        `SYSTEM ERROR: Insufficient personalization data. The current plan would be too generic. Ask the user one more "counter-intuitive" question (e.g., what's held them back before, their typical day, or a specific constraint) before proceeding to generate_blueprint. Do NOT call generate_blueprint yet.`
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
