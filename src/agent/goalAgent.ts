import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SupabaseCheckpointer } from '@/lib/supabaseCheckpointer';

import { AgentState, AgentStateType } from "./state";
import { tools } from "./tools";
import { MAX_STEPS_BEFORE_DRAFT, MAX_CRITIQUE_RETRIES } from "./constants";

// Import Nodes
import { consultantNode } from "./nodes/consultant";
import { frameworkSetterNode } from "./nodes/frameworkSetter";
import { askNode } from "./nodes/ask";
import { draftNode } from "./nodes/draft";
import { critiqueNode } from "./nodes/critique";
import { validatorNode } from "./nodes/validator";

// 1. Tool Node
const toolNode = new ToolNode(tools);

// --- ROUTERS ---

const routeStart = (state: AgentStateType) => {
    if (state.framework) {
        return "ask";
    }
    return "consultant";
};

const routeConsultant = (state: AgentStateType) => {
    const { messages } = state;
    if (!messages?.length) return END;
    const lastMsg = messages[messages.length - 1] as AIMessage;
    if (lastMsg.tool_calls?.some(tc => tc.name === 'set_framework')) {
        return "framework_setter";
    }
    return END;
};

const routeStep = (state: AgentStateType) => {
  const { messages, steps } = state;
  if (!messages?.length) return END;
  const lastMsg = messages[messages.length - 1] as AIMessage;
  if (steps > MAX_STEPS_BEFORE_DRAFT) return "draft";
  if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
      if (lastMsg.tool_calls.some(tc => tc.name === 'generate_blueprint')) {
          return "draft";
      }
      return "tools";
  }
  
  if (lastMsg.content.toString().trim().toUpperCase().includes("READY")) return "draft"; // Deprecated fallback

  return END;
};

const routeCritique = (state: AgentStateType) => {
    if (state.critiqueAttempts === MAX_CRITIQUE_RETRIES) return "draft";
    return END;
};

const routeValidator = (state: AgentStateType) => {
    const { validationAttempts, framework, messages } = state;
    if (!messages?.length) return END;
    const lastMsg = messages[messages.length - 1];
    // If we just added a correction prompt, loop back
    if (validationAttempts > 0 && lastMsg instanceof HumanMessage && lastMsg.content.toString().includes("SYSTEM ERROR")) {
        // Route back to the node that generated it
        if (framework) return "ask";
        return "consultant";
    }
    
    // If valid (or gave up), proceed with normal routing
    if (framework) {
        // Reuse routeStep logic
        return routeStep(state);
    } else {
        // Reuse routeConsultant logic
        return routeConsultant(state);
    }
};

// --- GRAPH ---

const workflow = new StateGraph(AgentState)
  .addNode("consultant", consultantNode)
  .addNode("framework_setter", frameworkSetterNode)
  .addNode("ask", askNode)
  .addNode("tools", toolNode)
  .addNode("draft", draftNode)
  .addNode("critique", critiqueNode)
  
  .addConditionalEdges(START, routeStart, {
      consultant: "consultant",
      ask: "ask"
  })

  // Validator Node
  .addNode("validator", validatorNode)

  // Consultant Flow: consultant -> validator -> (route)
  .addEdge("consultant", "validator")

  // Ask Flow: ask -> validator -> (route)
  .addEdge("ask", "validator")
  
  // Validator Routing
  .addConditionalEdges("validator", routeValidator, {
      ask: "ask",
      consultant: "consultant",
      framework_setter: "framework_setter",
      tools: "tools",
      draft: "draft",
      [END]: END
  })
  
  .addEdge("framework_setter", "ask")
  
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
