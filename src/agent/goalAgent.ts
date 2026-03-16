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
import { userReviewNode } from "./nodes/userReview";
import { validatorNode } from "./nodes/validator";
import { approvalGateNode } from "./nodes/approvalGate";

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
  if (steps > MAX_STEPS_BEFORE_DRAFT) return "approval_gate";
  if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
      return "tools";
  }
  return END;
};

/** After tools: if request_confirmation was executed, go to approval_gate; else ask. */
const routeAfterTools = (state: AgentStateType) => {
  const { messages } = state;
  if (!messages?.length) return "ask";
  const aiWithCalls = [...(messages || [])].reverse().find(
    (m: any) => (m._getType?.() === "ai" || m.constructor?.name === "AIMessage") && (m as AIMessage).tool_calls?.length
  ) as AIMessage | undefined;
  if (aiWithCalls?.tool_calls?.some((tc: { name?: string }) => tc.name === "request_confirmation")) {
    return "approval_gate";
  }
  return "ask";
};

/** After approval_gate: if user confirmed, go to draft; else ask (user wanted to continue). */
const routeAfterApprovalGate = (state: AgentStateType) => {
  const r = state.approvalGateResult;
  if (r?.confirmed) return "draft";
  return "ask";
};

const routeCritique = (state: AgentStateType) => {
    if (state.critiqueAttempts === MAX_CRITIQUE_RETRIES) return "draft";
    return "user_review";
};

const routeUserReview = (state: AgentStateType) => {
    if (state.userReviewRequestsRefinement) return "draft";
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
  .addNode("user_review", userReviewNode)
  
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
      approval_gate: "approval_gate",
      draft: "draft",
      [END]: END
  })
  
  .addEdge("framework_setter", "ask")
  
  .addNode("approval_gate", approvalGateNode)
  .addConditionalEdges("tools", routeAfterTools, {
      approval_gate: "approval_gate",
      ask: "ask"
  })
  .addConditionalEdges("approval_gate", routeAfterApprovalGate, {
      draft: "draft",
      ask: "ask"
  })

  // Draft/Critique Flow
  .addEdge("draft", "critique")
  .addConditionalEdges("critique", routeCritique, {
      draft: "draft",
      user_review: "user_review"
  })
  .addConditionalEdges("user_review", routeUserReview, {
      draft: "draft",
      [END]: END
  });

const checkpointer = isSupabaseConfigured && supabase 
    ? new SupabaseCheckpointer(supabase) 
    : new MemorySaver();

// Use interruptBefore instead of interrupt() inside the node: interrupt() relies on
// AsyncLocalStorage which is not reliably set in the browser, causing "Called interrupt()
// outside the context of a graph". Pausing before approval_gate works in all environments.
export const graph = workflow.compile({
  checkpointer: checkpointer,
  interruptBefore: ["approval_gate"],
});
