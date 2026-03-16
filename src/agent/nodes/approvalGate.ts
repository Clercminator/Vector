import { HumanMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";

/** Used by frontend to detect our approval-gate interrupt (interruptBefore). */
export const CONFIRM_PLAN_INTERRUPT_TYPE = "confirm_plan_generation";

/** Approval gate node: runs only after resume. State is updated by Command(update) from the client. */
export const approvalGateNode = async (state: AgentStateType) => {
  // With interruptBefore, we only run after the user resumes. The client sends
  // Command({ update: { approvalGateResult: { confirmed, userMessage? } } }), so state is already set.
  const payload = state.approvalGateResult;
  if (payload == null) {
    // Should not happen if client always sends update on resume; fallback for safety.
    return { approvalGateResult: { confirmed: false } };
  }
  const confirmed = payload.confirmed === true;
  const userMessage = typeof payload.userMessage === "string" ? payload.userMessage.trim() : undefined;

  if (confirmed) {
    return { approvalGateResult: { confirmed: true } };
  }
  return {
    approvalGateResult: { confirmed: false },
    messages: userMessage ? [new HumanMessage(userMessage)] : [],
  };
};
