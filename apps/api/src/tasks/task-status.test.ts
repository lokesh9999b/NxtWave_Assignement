import { describe, expect, it } from "vitest";
import { canTransition } from "./task-status.js";

describe("task status transitions", () => {
  it("allows the required forward workflow", () => {
    expect(canTransition("TODO", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "IN_REVIEW")).toBe(true);
    expect(canTransition("IN_REVIEW", "DONE")).toBe(true);
  });

  it("rejects skipped workflow states", () => {
    expect(canTransition("TODO", "DONE")).toBe(false);
    expect(canTransition("DONE", "IN_PROGRESS")).toBe(false);
  });
});
