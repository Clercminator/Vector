import { describe, expect, it } from "vitest";

import { shouldDefaultLemonSqueezyToTestForHostname } from "./lemonSqueezy";

describe("lemonSqueezy environment selection", () => {
  it("defaults localhost requests to test mode", () => {
    expect(shouldDefaultLemonSqueezyToTestForHostname("localhost")).toBe(true);
    expect(shouldDefaultLemonSqueezyToTestForHostname("127.0.0.1")).toBe(true);
  });

  it("defaults Vercel preview deployments to test mode", () => {
    expect(
      shouldDefaultLemonSqueezyToTestForHostname(
        "vector-git-preview-clercminators-projects.vercel.app",
      ),
    ).toBe(true);
    expect(
      shouldDefaultLemonSqueezyToTestForHostname(
        "vector-preview-branch-clercminators-projects.vercel.app",
      ),
    ).toBe(true);
  });

  it("keeps production-style hosts in live mode by default", () => {
    expect(shouldDefaultLemonSqueezyToTestForHostname("vectorplan.xyz")).toBe(
      false,
    );
    expect(
      shouldDefaultLemonSqueezyToTestForHostname("vector.vercel.app"),
    ).toBe(false);
  });
});
