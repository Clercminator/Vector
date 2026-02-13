import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

vi.mock("@/agent/utils", () => ({
  invokeWithFallback: vi.fn(),
}));

import { graph } from "@/agent/goalAgent";
import { invokeWithFallback } from "@/agent/utils";

describe("goalAgent integration", () => {
  beforeEach(() => {
    vi.mocked(invokeWithFallback).mockReset();
  });

  it("runs consultant → validator → END and returns state with messages when consultant returns text", async () => {
    vi.mocked(invokeWithFallback).mockResolvedValue(
      new AIMessage("I recommend the Pareto (80/20) framework for this. Shall we build the plan?")
    );

    const inputs = {
      messages: [new HumanMessage("I want to get fit.")],
      goal: "I want to get fit.",
      framework: null as string | null,
      tier: "architect",
      validFrameworks: ["first-principles", "pareto", "rpm"],
      language: "en",
    };
    const config = { configurable: { thread_id: "integration-test-1" } };

    const finalState = await graph.invoke(inputs, config);

    expect(invokeWithFallback).toHaveBeenCalled();
    expect(finalState?.messages?.length).toBeGreaterThan(0);
    expect(finalState?.framework).toBeNull();
  });

  it("runs consultant → framework_setter → ask when consultant returns set_framework tool call", async () => {
    const aiWithToolCall = new AIMessage({
      content: "Let's use RPM. Ready to proceed?",
      tool_calls: [
        {
          id: "tc-1",
          name: "set_framework",
          args: { framework: "rpm" },
        },
      ],
    });
    vi.mocked(invokeWithFallback)
      .mockResolvedValueOnce(aiWithToolCall)
      .mockResolvedValue(new AIMessage("What is your target date?"));

    const inputs = {
      messages: [new HumanMessage("I want to run a marathon.")],
      goal: "I want to run a marathon.",
      framework: null as string | null,
      tier: "architect",
      validFrameworks: ["first-principles", "pareto", "rpm"],
      language: "en",
    };
    const config = { configurable: { thread_id: "integration-test-2" } };

    const finalState = await graph.invoke(inputs, config);

    expect(invokeWithFallback).toHaveBeenCalled();
    expect(finalState?.framework).toBe("rpm");
  });
});
