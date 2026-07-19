import { describe, expect, it, vi } from "vitest";
import { logEvent } from "@/lib/logger";

describe("structured logger", () => {
  it("redacts secrets and normalizes errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logEvent("error", "test.failure", {
      authorization: "Bearer exposed",
      error: new Error("database details"),
    });
    const entry = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(entry.authorization).toBe("[REDACTED]");
    expect(entry.error).toEqual({ name: "Error", message: "Internal error" });
    expect(entry.event).toBe("test.failure");
    spy.mockRestore();
  });
});
