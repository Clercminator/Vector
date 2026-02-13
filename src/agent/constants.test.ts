import { describe, it, expect } from "vitest";
import {
  MAX_STEPS_BEFORE_DRAFT,
  MESSAGE_WINDOW_SIZE,
  MAX_VALIDATION_ATTEMPTS,
  MAX_CRITIQUE_RETRIES,
  DRAFT_HISTORY_MAX_CHARS,
  getEmptyMessageReply,
  MAX_USER_MESSAGE_CHARS,
  getLongMessageReply,
} from "./constants";

describe("agent constants", () => {
  it("MAX_STEPS_BEFORE_DRAFT is 10", () => {
    expect(MAX_STEPS_BEFORE_DRAFT).toBe(10);
  });

  it("MESSAGE_WINDOW_SIZE is 20", () => {
    expect(MESSAGE_WINDOW_SIZE).toBe(20);
  });

  it("MAX_VALIDATION_ATTEMPTS is 2", () => {
    expect(MAX_VALIDATION_ATTEMPTS).toBe(2);
  });

  it("MAX_CRITIQUE_RETRIES is 1", () => {
    expect(MAX_CRITIQUE_RETRIES).toBe(1);
  });

  it("DRAFT_HISTORY_MAX_CHARS is positive", () => {
    expect(DRAFT_HISTORY_MAX_CHARS).toBeGreaterThan(0);
  });

  it("getEmptyMessageReply returns en for unknown lang", () => {
    expect(getEmptyMessageReply("xx")).toContain("Please type");
  });

  it("getEmptyMessageReply returns localized string for known lang", () => {
    expect(getEmptyMessageReply("es")).toContain("Escribe");
    expect(getEmptyMessageReply("en")).toContain("Please type");
  });

  it("MAX_USER_MESSAGE_CHARS is positive", () => {
    expect(MAX_USER_MESSAGE_CHARS).toBeGreaterThan(0);
  });

  it("getLongMessageReply returns en for unknown lang", () => {
    expect(getLongMessageReply("xx")).toContain("summarize");
  });
});
