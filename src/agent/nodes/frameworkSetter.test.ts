import { describe, it, expect } from "vitest";
import { AIMessage } from "@langchain/core/messages";
import { frameworkSetterNode } from "./frameworkSetter";
import type { AgentStateType } from "../state";

const baseState = (overrides: Partial<AgentStateType> & { messages: AgentStateType["messages"] }): AgentStateType =>
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

describe("frameworkSetterNode", () => {
  it("sets framework and returns tool message when tool call has known framework", async () => {
    const state = baseState({
      messages: [
        new AIMessage({
          content: "Let's use RPM.",
          tool_calls: [
            { id: "tc-1", name: "set_framework", args: { framework: "rpm" } },
          ],
        }),
      ],
    });
    const out = await frameworkSetterNode(state);
    expect(out.framework).toBe("rpm");
    expect(out.messages).toHaveLength(1);
    expect(out.messages![0].content).toContain("Switched to rpm");
    expect(out.steps).toBe(1);
  });

  it("does not set framework and returns error message when tool call has unknown framework", async () => {
    const state = baseState({
      messages: [
        new AIMessage({
          content: "Let's use something.",
          tool_calls: [
            { id: "tc-1", name: "set_framework", args: { framework: "unknown-fw" } },
          ],
        }),
      ],
    });
    const out = await frameworkSetterNode(state);
    expect(out.framework).toBeUndefined();
    expect(out.messages).toHaveLength(1);
    expect(String(out.messages![0].content)).toContain("Unknown framework");
    expect(String(out.messages![0].content)).toContain("unknown-fw");
  });

  it("returns empty object when last message has no set_framework tool call", async () => {
    const state = baseState({
      messages: [new AIMessage("Just text.")],
    });
    const out = await frameworkSetterNode(state);
    expect(out).toEqual({});
  });
});
