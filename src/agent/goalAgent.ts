import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, MessagesAnnotation, Annotation, START, END, MemorySaver } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import * as math from 'mathjs';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SupabaseCheckpointer } from '@/lib/supabaseCheckpointer';
import fpPrompt from "@/lib/prompts/first-principles.txt?raw";
import paretoPrompt from "@/lib/prompts/pareto.txt?raw";
import rpmPrompt from "@/lib/prompts/rpm.txt?raw";
import eisenhowerPrompt from "@/lib/prompts/eisenhower.txt?raw";
import okrPrompt from "@/lib/prompts/okr.txt?raw";
import gpsPrompt from "@/lib/prompts/gps.txt?raw";
import consultantPrompt from "@/lib/prompts/consultant.txt?raw";

// Define the State
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  goal: Annotation<string>,
  framework: Annotation<string | null>({
      reducer: (x, y) => y ?? x,
      default: () => null,
  }), 
  tier: Annotation<string>({
      reducer: (x, y) => y ?? x,
      default: () => "architect",
  }),
  validFrameworks: Annotation<string[]>({
      reducer: (x, y) => y ?? x,
      default: () => ["first-principles", "pareto", "rpm"], // Default to free tier list
  }),
  blueprint: Annotation<any>,
  steps: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
  critiqueAttempts: Annotation<number>({
     reducer: (x, y) => x + y,
     default: () => 0,
  }),
});

// --- TOOLS ---

// 1. Calculator (Enhanced with mathjs)
const calculator = tool(async ({ expression }) => {
  try {
    if (expression.length > 50) return "Error: Expression too long.";
    const result = math.evaluate(expression);
    return `Result: ${result}`;
  } catch (error) {
    return "Error: Invalid mathematical expression.";
  }
}, {
  name: "calculator",
  description: "Perform mathematical calculations.",
  schema: z.object({
    expression: z.string().describe("The mathematical expression to evaluate.")
  })
});

// 2. Get Current Time
const getCurrentTime = tool(async () => {
  return new Date().toISOString();
}, {
  name: "getCurrentTime",
  description: "Get the current date and time.",
  schema: z.object({})
});

// 3. Get General News (RSS)
const getGeneralNews = tool(async () => {
  try {
    const response = await fetch("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");
    const text = await response.text();
    const items = text.match(/<title>(.*?)<\/title>/g)?.slice(1, 6).map(t => t.replace(/<\/?title>/g, '')) || [];
    return items.length > 0 ? items.join("\n") : "No news data available.";
  } catch (e) {
    return "Error fetching news.";
  }
}, {
  name: "getGeneralNews",
  description: "Get the latest top general news headlines.",
  schema: z.object({})
});

// 4. Set Framework (Consultant Tool) - This is a "virtual" tool to trigger state transition
const setFramework = tool(async ({ framework }) => {
    return `Framework set to ${framework}`;
}, {
    name: "set_framework",
    description: "Select the framework to use. Call this ONLY when the user has explicitly agreed to a framework suggestion.",
    schema: z.object({
        framework: z.enum(['first-principles', 'pareto', 'rpm', 'eisenhower', 'okr', 'gps', 'dsss', 'mandalas'])
    })
});

const tools = [calculator, getCurrentTime, getGeneralNews, setFramework];
const toolNode = new ToolNode(tools);

// --- LLM ---
const modelConfig = {
  temperature: 0.7,
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "dummy",
  configuration: {
    baseURL: import.meta.env.VITE_OPENROUTER_PROXY_URL,
  }
};

const deepseek = new ChatOpenAI({
  ...modelConfig,
  model: "deepseek/deepseek-v3.2", 
});

const gemini = new ChatOpenAI({
  ...modelConfig,
  model: "google/gemini-3-flash-preview", 
});

const llm = deepseek.bindTools(tools).withFallbacks([gemini.bindTools(tools)]);

// --- NODES ---

const frameworkContexts: Record<string, string> = {
  'first-principles': fpPrompt,
  'pareto': paretoPrompt,
  'rpm': rpmPrompt,
  'eisenhower': eisenhowerPrompt,
  'okr': okrPrompt,
  'gps': gpsPrompt
};

// 1. Consultant Node (Diagnosis)
const consultantNode = async (state: typeof AgentState.State) => {
    const { goal, tier, validFrameworks, messages } = state;
    
    // Replace placeholders in the prompt
    let promptText = consultantPrompt
        .replace("{{goal}}", goal)
        .replace("{{tier}}", tier)
        .replace("{{valid_frameworks}}", validFrameworks.join(", "))
        .replace("{{all_frameworks}}", Object.keys(frameworkContexts).join(", "))
        + `\n\nIMPORTANT: To help the user answer quickly, ALWAYS end your message with 2-3 short, relevant suggestion chips in this exact format:
        ||| ["Suggestion 1", "Suggestion 2"]`;
        
    const sysMsg = new SystemMessage(promptText);
    
    // Filter out previous system messages to keep context clean
    const recentMessages = messages.filter(m => !(m instanceof SystemMessage));
    
    const response = await llm.invoke([sysMsg, ...recentMessages]);
    return { messages: [response] };
};

// 2. Framework Setter Node (State Update)
const frameworkSetterNode = async (state: typeof AgentState.State) => {
    const lastMsg = state.messages[state.messages.length - 1] as AIMessage;
    const toolCall = lastMsg.tool_calls?.find(tc => tc.name === 'set_framework');
    
    if (!toolCall) return {}; // Should not happen given routing

    const framework = toolCall.args.framework;
    
    return {
        framework,
        messages: [
            new ToolMessage({
                tool_call_id: toolCall.id,
                content: `Framework selected: ${framework}. Transitioning to Refinement.`
            }),
            new AIMessage(`Excellent. We are using the **${framework}** framework. Let's refine your plan.`)
        ]
    };
}

// 3. Ask Node (Refinement)
const askNode = async (state: typeof AgentState.State) => {
  const { goal, framework, messages } = state;
  if (!framework) return {}; // Safety

  const sysMsg = new SystemMessage(`You are an expert strategic advisor using the "${framework}" framework. 
  
  ${frameworkContexts[framework] || ""}

  Your goal is to help the user refine their goal: "${goal}".
  
  Current Phase: REFINEMENT & PLANNING
  
  Instructions:
  1. Ask 1-2 critical questions to fill the gaps for the blueprint.
  2. Be concise.
  3. When you have enough info, summarize and ASK: "Ready to generate the blueprint?"
  4. If user says "Yes/Ready", reply exactly "READY".

  IMPORTANT: To help the user answer quickly, ALWAYS end your message with 2-3 short, relevant suggestion chips in this exact format:
  ||| ["Suggestion 1", "Suggestion 2"]
  Example: "Do you want to focus on habits or goals? ||| ["Habits", "Goals"]"
  `);

  // Filter messages to avoid duplicate system prompts or confusion with consultant phase
  // We keep history but ensure the latest system prompt is dominant.
  const response = await llm.invoke([sysMsg, ...messages]);
  return { messages: [response], steps: 1 };
};

// --- ROUTERS ---

const routeStart = (state: typeof AgentState.State) => {
    if (state.framework) {
        return "ask";
    }
    return "consultant";
};

const routeConsultant = (state: typeof AgentState.State) => {
    const lastMsg = state.messages[state.messages.length - 1] as AIMessage;
    if (lastMsg.tool_calls?.some(tc => tc.name === 'set_framework')) {
        return "framework_setter";
    }
    return END; // Wait for user input
};

const routeStep = (state: typeof AgentState.State) => {
  const { messages, steps } = state;
  const lastMsg = messages[messages.length - 1] as AIMessage;
  
  if (steps > 15) return "draft";
  if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) return "tools";
  if (lastMsg.content.toString().trim().toUpperCase().includes("READY")) return "draft"; // Loosened check

  return END;
};

// 4. Draft Node (Generation)
const draftNode = async (state: typeof AgentState.State) => {
  const { goal, framework, messages, tier, validFrameworks } = state;
  
  // Check if locked
  const isLocked = !validFrameworks.includes(framework || "");
  
  const draftLlm = new ChatOpenAI({
     model: "openai/gpt-4o",
     temperature: 0.2,
     apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "dummy", 
     configuration: { baseURL: import.meta.env.VITE_OPENROUTER_PROXY_URL || "https://openrouter.ai/api/v1" }
  });

  let prompt = "";
  if (isLocked) {
      prompt = `Generate a TEASER PREVIEW JSON blueprint for "${framework}".
      Goal: "${goal}"
      History: ${messages.map(m => m.content).join('\n')}
      
      The user is on a FREE tier and this is a PREMIUM framework.
      Instructions:
      1. Provide high-quality content for the first 1-2 items only.
      2. For the rest, use placeholder text like "Upgrade to unlock".
      3. Set "isTeaser": true in the JSON.
      
      Output Schema (JSON ONLY):
      - 'pareto': { "type": "pareto", "vital": ["One Vital Task"], "trivial": ["Upgrade to see..."], "isTeaser": true }
      - 'first-principles': { "type": "first-principles", "truths": ["One Truth..."], "newApproach": "Upgrade to reveal...", "isTeaser": true }
      - 'rpm': { "type": "rpm", "result": "The Result...", "purpose": "Upgrade...", "plan": ["Task 1..."], "isTeaser": true }
      - 'eisenhower': { "type": "eisenhower", "q1": ["Do This..."], "q2": ["Upgrade..."], "q3": [], "q4": [], "isTeaser": true }
      - 'okr': { "type": "okr", "objective": "The Objective...", "keyResults": ["KR 1..."], "initiative": "Upgrade...", "isTeaser": true }
      
      Return ONLY the JSON.`;
  } else {
      prompt = `Generate a valid JSON blueprint for "${framework}".
      Goal: "${goal}"
      History: ${messages.map(m => m.content).join('\n')}
      
      Output Schema (JSON ONLY):
      - 'pareto': { "type": "pareto", "vital": ["..."], "trivial": ["..."] }
      - 'first-principles': { "type": "first-principles", "truths": ["..."], "newApproach": "..." }
      - 'rpm': { "type": "rpm", "result": "...", "purpose": "...", "plan": ["..."] }
      - 'eisenhower': { "type": "eisenhower", "q1": [...], "q2": [...], "q3": [...], "q4": [...] }
      - 'okr': { "type": "okr", "objective": "...", "keyResults": ["..."], "initiative": "..." }
      - 'gps': { "type": "gps", "goal": "...", "plan": ["..."], "system": ["..."], "anti_goals": ["..."] }
      
      Return ONLY the JSON.`;
  }

  const response = await draftLlm.invoke([new SystemMessage(prompt)]);
  let content = response.content.toString().replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const blueprint = JSON.parse(content);
    return { blueprint, messages: [new AIMessage("Here is your strategic blueprint.")] };
  } catch (e) {
    return { messages: [new AIMessage("Error generating blueprint. Please try again.")] };
  }
};

const critiqueNode = async (state: typeof AgentState.State) => {
    const { blueprint, framework, critiqueAttempts } = state;
    if (critiqueAttempts > 0) return { critiqueAttempts: 1 };

    const criticLlm = new ChatOpenAI({
        model: "openai/gpt-4o-mini",
        temperature: 0.3,
        apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "dummy", 
        configuration: { baseURL: import.meta.env.VITE_OPENROUTER_PROXY_URL }
    });
    
    if (!blueprint) return { critiqueAttempts: 1 };

    const rubric: Record<string, string> = {
      'okr': "Check if Key Results are MEASURABLE (contain numbers/%). Objective should be ambitious.",
      'pareto': "Ensure 'Vital' tasks are truly high-impact and 'Trivial' are lower value.",
      'rpm': "Ensure 'Purpose' is compelling and emotional, not just a description.",
      'eisenhower': "Ensure Q1 is urgent/important and Q2 is long-term strategic.",
      'first-principles': "Ensure 'Truths' are fundamental facts, not assumptions.",
      'default': "Ensure the JSON is valid and content is specific."
    };
    
    const specificRubric = rubric[framework || 'default'] || rubric['default'];

    const prompt = `Critique this ${framework} JSON: ${JSON.stringify(blueprint)}.
    
    Rubric: ${specificRubric}
    
    If it meets the criteria, return exactly "PASS".
    If it fails, return a concise (1 sentence) instruction on how to fix it.`;
    
    const response = await criticLlm.invoke([new SystemMessage(prompt)]);
    const result = response.content.toString().trim();
    
    if (result === "PASS") return { critiqueAttempts: 0 }; // No increment
    return { critiqueAttempts: 1, messages: [new HumanMessage(`The previous blueprint was rejected. Fix: ${result}`)] }; // Treat as human feedback for the draft node
};

const routeCritique = (state: typeof AgentState.State) => {
    if (state.critiqueAttempts === 1) return "draft";
    return END;
};

// --- GRAPH ---

const workflow = new StateGraph(AgentState)
  .addNode("consultant", consultantNode)
  .addNode("framework_setter", frameworkSetterNode)
  .addNode("ask", askNode)
  .addNode("tools", toolNode)
  .addNode("draft", draftNode)
  .addNode("critique", critiqueNode)
  
  .addEdge(START, "consultant") // Actually, we need a conditional start
  .addConditionalEdges(START, routeStart, {
      consultant: "consultant",
      ask: "ask"
  })

  // Consultant Flow
  .addConditionalEdges("consultant", routeConsultant, {
      framework_setter: "framework_setter",
      [END]: END
  })
  .addEdge("framework_setter", "ask")

  // Ask/Refinement Flow
  .addConditionalEdges("ask", routeStep, {
      tools: "tools",
      draft: "draft",
      [END]: END
  })
  .addEdge("tools", "ask")

  // Draft/Critique Flow
  .addEdge("draft", "critique")
  .addConditionalEdges("critique", routeCritique, {
      draft: "draft",
      [END]: END
  });

const checkpointer = isSupabaseConfigured && supabase 
    ? new SupabaseCheckpointer(supabase) 
    : new MemorySaver();

export const graph = workflow.compile({
  checkpointer: checkpointer,
});
