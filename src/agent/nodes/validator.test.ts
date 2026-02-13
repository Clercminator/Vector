import { describe, it, expect } from "vitest";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { validatorNode } from "./validator";
import type { AgentStateType } from "../state";

const baseState = (
  overrides: Partial<AgentStateType> & { messages: AgentStateType["messages"] }
): AgentStateType =>
  ({
    goal: "",
    framework: null,
    tier: "architect",
    validFrameworks: [],
    blueprint: undefined,
    steps: 0,
    critiqueAttempts: 0,
    validationAttempts: 0,
    hardMode: false,
    language: "en",
    ...overrides,
  }) as AgentStateType;

describe("validatorNode", () => {
  it("returns validationAttempts: 0 when no draft block is present", async () => {
    const state = baseState({
      messages: [new AIMessage("Just some text.")],
      framework: "pareto",
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(0);
    expect(out.messages).toBeUndefined();
  });

  it("accepts valid Pareto draft JSON and resets validationAttempts", async () => {
    const state = baseState({
      messages: [
        new AIMessage(
          `Here is my thinking.\n|||DRAFT_START|||\n{"vital": ["A"], "trivial": ["B"]}\n|||DRAFT_END|||`
        ),
      ],
      framework: "pareto",
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(0);
    expect(out.messages).toBeUndefined();
  });

  it("accepts valid RPM draft with type key", async () => {
    const state = baseState({
      messages: [
        new AIMessage(
          `\n|||DRAFT_START|||\n{"type":"rpm","result":"R","purpose":"P","plan":["Step 1"]}\n|||DRAFT_END|||`
        ),
      ],
      framework: "rpm",
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(0);
  });

  it("rejects invalid JSON in draft block and increments validationAttempts", async () => {
    const state = baseState({
      messages: [
        new AIMessage(
          `\n|||DRAFT_START|||\n{ invalid json }\n|||DRAFT_END|||`
        ),
      ],
      framework: "pareto",
      validationAttempts: 0,
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(1);
    expect(out.messages).toHaveLength(1);
    expect(out.messages![0]).toBeInstanceOf(HumanMessage);
    expect(String((out.messages![0] as HumanMessage).content)).toContain("SYSTEM ERROR");
  });

  it("rejects draft with unknown keys for framework", async () => {
    const state = baseState({
      messages: [
        new AIMessage(
          `\n|||DRAFT_START|||\n{"vital": ["A"], "trivial": ["B"], "unknownKey": "x"}\n|||DRAFT_END|||`
        ),
      ],
      framework: "pareto",
      validationAttempts: 0,
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(1);
    expect(out.messages).toHaveLength(1);
    expect(String((out.messages![0] as HumanMessage).content)).toContain("Unknown properties");
  });

  it("on give-up (validationAttempts >= MAX), strips draft block and returns cleaned message", async () => {
    const msgId = "ai-123";
    const state = baseState({
      messages: [
        new AIMessage({
          content:
            "Summary.\n|||DRAFT_START|||\n{ broken }\n|||DRAFT_END|||",
          id: msgId,
        }),
      ],
      framework: "pareto",
      validationAttempts: 2,
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(0);
    expect(out.messages).toHaveLength(1);
    const cleaned = out.messages![0] as AIMessage;
    expect(cleaned.content).toBe("Summary.");
    expect((cleaned as { id?: string }).id).toBe(msgId);
  });

  it("on give-up with empty content after strip uses placeholder", async () => {
    const state = baseState({
      messages: [
        new AIMessage({
          content: "|||DRAFT_START|||\n{ }\n|||DRAFT_END|||",
          id: "ai-456",
        }),
      ],
      framework: "rpm",
      validationAttempts: 2,
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(0);
    const cleaned = out.messages![0] as AIMessage;
    expect(cleaned.content).toContain("Draft block removed");
  });

  it("returns validationAttempts 0 when messages is empty", async () => {
    const state = baseState({ messages: [], framework: "pareto" });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(0);
    expect(out.messages).toBeUndefined();
  });

  it("returns validationAttempts 0 when last message is HumanMessage", async () => {
    const state = baseState({
      messages: [new HumanMessage("User reply here.")],
      framework: "pareto",
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(0);
  });

  it("rejects malformed draft block (DRAFT_START without DRAFT_END)", async () => {
    const state = baseState({
      messages: [
        new AIMessage("Some text.\n|||DRAFT_START|||\n{\"vital\": []"),
      ],
      framework: "pareto",
      validationAttempts: 0,
    });
    const out = await validatorNode(state);
    expect(out.validationAttempts).toBe(1);
    expect(out.messages).toHaveLength(1);
    expect(String((out.messages![0] as HumanMessage).content)).toContain("incomplete");
    expect(String((out.messages![0] as HumanMessage).content)).toContain("DRAFT_END");
  });
});
