import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, MessagesAnnotation, Annotation, START, END, MemorySaver } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import * as math from 'mathjs';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SupabaseCheckpointer } from '@/lib/supabaseCheckpointer';

// Define the State
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  goal: Annotation<string>,
  framework: Annotation<string>, // 'first-principles', 'pareto', 'rpm', 'eisenhower', 'okr'
  blueprint: Annotation<any>,
  steps: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
});

// --- TOOLS ---

// 1. Calculator (Enhanced with mathjs)
const calculator = tool(async ({ expression }) => {
  try {
    // MathJS evaluate is safer than eval, but we still sanitizing input length
    if (expression.length > 50) return "Error: Expression too long.";
    const result = math.evaluate(expression);
    return `Result: ${result}`;
  } catch (error) {
    return "Error: Invalid mathematical expression.";
  }
}, {
  name: "calculator",
  description: "Perform mathematical calculations. Input should be a mathematical expression string.",
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

// 3. Get General News (RSS) - Keeping simpler RSS for now, recommending Tavily for Phase 2
const getGeneralNews = tool(async () => {
  try {
    const response = await fetch("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");
    const text = await response.text();
    // Simple regex to extract titles (improved for robustness)
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

const tools = [calculator, getCurrentTime, getGeneralNews];
const toolNode = new ToolNode(tools);

// --- LLM ---
// Uses OpenRouter with proxy/keys as before
const llm = new ChatOpenAI({
  model: "openai/gpt-4o",
  temperature: 0.7,
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "dummy",
  configuration: {
    baseURL: import.meta.env.VITE_OPENROUTER_PROXY_URL,
  }
}).bindTools(tools);

// --- NODES ---

const askNode = async (state: typeof AgentState.State) => {
  const { goal, framework, messages } = state;
  const sysMsg = new SystemMessage(`You are an expert strategic advisor using the "${framework}" framework. 
  Your goal is to help the user refine their goal: "${goal}".
  
  Current Phase: INFORMATION GATHERING
  
  Guidelines:
  1. DO NOT act like a therapist. Focus on strategy, execution, and metrics.
  2. Ask up to 3 distinct, high-impact questions to clarify the goal if details are missing.
  3. Use tools (calculator, news, time) ONLY if strictly necessary.
  4. If the user's goal involves current events, use the 'getGeneralNews' tool.
  5. If the user asks for math, use 'calculator'.
  6. If you have enough information to build a structured blueprint, reply ONLY with "READY".
  `);

  const response = await llm.invoke([sysMsg, ...messages]);
  return { messages: [response], steps: 1 };
};

const routeStep = (state: typeof AgentState.State) => {
  const { messages, steps } = state;
  const lastMsg = messages[messages.length - 1] as AIMessage;
  
  // Cost Control
  if (steps > 15) {
      return "draft"; // Force finish if too many steps
  }

  // If tool calls, go to tools
  if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
    return "tools";
  }

  // If ANY content in the last message is exact "READY" (or close enough), go to draft
  if (lastMsg.content.toString().trim().toUpperCase() === "READY") {
    return "draft";
  }

  // Else, check for readiness via a smaller router call? 
  // Optimization: Just rely on the main LLM to say READY as instructed.
  // If it didn't say READY and didn't call tools, it means it's asking a question -> return to user (END of graph turn)
  return END;
};

const draftNode = async (state: typeof AgentState.State) => {
  // Use a fresh LLM call to ensure structured JSON output
  const { goal, framework, messages } = state;
  
  const draftLlm = new ChatOpenAI({
     model: "openai/gpt-4o",
     temperature: 0.2, // Lower temp for JSON
     apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "dummy", 
     configuration: { baseURL: import.meta.env.VITE_OPENROUTER_PROXY_URL }
  });

  const prompt = `Based on the conversation, generate a valid JSON blueprint for the framework "${framework}".
  Goal: "${goal}"
  Conversation History:
  ${messages.map(m => m.content).join('\n')}
  
  Output Schema (JSON ONLY):
  - For 'pareto': { "type": "pareto", "vital": ["..."], "trivial": ["..."] }
  - For 'first-principles': { "type": "first-principles", "truths": ["..."], "newApproach": "..." }
  - For 'rpm': { "type": "rpm", "result": "...", "purpose": "...", "plan": ["..."] }
  - For 'eisenhower': { "type": "eisenhower", "q1": [...], "q2": [...], "q3": [...], "q4": [...] }
  - For 'okr': { "type": "okr", "objective": "...", "keyResults": ["..."], "initiative": "..." }
  
  Return ONLY the JSON. No markdown formatting.`;

  const response = await draftLlm.invoke([new SystemMessage(prompt)]);
  let content = response.content.toString();
  
  // Sanitize Markdown code blocks if present
  content = content.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const blueprint = JSON.parse(content);
    return { blueprint, messages: [new AIMessage("Here is your strategic blueprint.")] };
  } catch (e) {
    return { messages: [new AIMessage("Error generating blueprint. Please try again.")] };
  }
};

// --- GRAPH ---

const workflow = new StateGraph(AgentState)
  .addNode("ask", askNode)
  .addNode("tools", toolNode)
  .addNode("draft", draftNode)
  .addEdge(START, "ask")
  .addConditionalEdges("ask", routeStep, {
      tools: "tools",
      draft: "draft",
      [END]: END
  })
  .addEdge("tools", "ask") // After tool, go back to ask to synthesize answer
  .addEdge("draft", END);

// Use Supabase checkpointer if available and configured, otherwise MemorySaver.
// Note: We check if 'checkpoints' table exists implicitly by usage, but here assume if supabase variable is present we try it.
// However, the checkpointer usage requires the tables to exist. 
// For now, let's export correct checkpointer.
// Using 'any' cast to avoid strict interface deleteThread checks if strict tsConfig (though solved above)
// Use Supabase checkpointer if available and configured, otherwise MemorySaver.
const checkpointer = isSupabaseConfigured && supabase 
    ? new SupabaseCheckpointer(supabase) 
    : new MemorySaver();

export const graph = workflow.compile({
  checkpointer: checkpointer,
});
