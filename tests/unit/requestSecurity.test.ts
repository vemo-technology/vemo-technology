import { describe, expect, it } from "vitest";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/requestSecurity";

describe("request security", () => {
  it("rejects cross-origin mutations", () => {
    const request = new Request("https://www.vemo-technology.com/api/test", {
      headers: { origin: "https://attacker.example" },
    });
    expect(enforceSameOrigin(request)?.status).toBe(403);
  });

  it("limits repeated requests by scope and address", () => {
    const request = new Request("https://example.test/api/test", {
      headers: { "x-forwarded-for": "192.0.2.10" },
    });
    expect(enforceRateLimit(request, "unit-test", 1, 60_000)).toBeNull();
    expect(enforceRateLimit(request, "unit-test", 1, 60_000)?.status).toBe(429);
  });
});
