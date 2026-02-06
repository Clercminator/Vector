import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";

export const validatorNode = async (state: AgentStateType) => {
    const { messages, validationAttempts, framework } = state;
    const lastMsg = messages[messages.length - 1] as AIMessage;
    
    // Safety check: ensure we don't loop forever
    if (validationAttempts >= 2) {
         // Fallback: Strip bad JSON
         const cleanContent = lastMsg.content.toString().replace(/\|\|\|DRAFT_START\|\|\|[\s\S]*?\|\|\|DRAFT_END\|\|\|/, '');
         return { validationAttempts: 0 };
    }

    const content = lastMsg.content.toString();
    const draftMatch = content.match(/\|\|\|DRAFT_START\|\|\|([\s\S]*?)\|\|\|DRAFT_END\|\|\|/);
    
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
                    'misogi': ['challenge', 'gap', 'purification']
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
