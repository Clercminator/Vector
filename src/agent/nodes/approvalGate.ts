import { interrupt } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { AgentStateType } from "../state";

export const CONFIRM_PLAN_INTERRUPT_TYPE = "confirm_plan_generation";

export const approvalGateNode = async (state: AgentStateType) => {
  const lastAi = [...(state.messages || [])].reverse().find(
    (m: any) => m._getType?.() === "ai" || (m.constructor?.name === "AIMessage")
  );
  const lastContent = (lastAi as any)?.content?.toString?.()?.slice(0, 300) || "";

  const result = interrupt({
    type: CONFIRM_PLAN_INTERRUPT_TYPE,
    message:
      "Vector is ready to generate your plan. Click the button when you're ready, or type in the chat to continue exploring your goal.",
  });

  const payload =
    typeof result === "object" && result !== null
      ? (result as { confirmed?: boolean; userMessage?: string })
      : { confirmed: !!result };
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
