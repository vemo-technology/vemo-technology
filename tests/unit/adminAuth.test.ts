import { afterEach, describe, expect, it } from "vitest";
import { createPasswordSessionToken, verifyPasswordSessionToken } from "@/lib/adminAuth";

describe("admin password session", () => {
  const previousSecret = process.env.VEMO_ADMIN_SECRET;
  afterEach(() => { process.env.VEMO_ADMIN_SECRET = previousSecret; });

  it("accepts a valid signed token and rejects tampering", () => {
    process.env.VEMO_ADMIN_SECRET = "unit-test-secret-with-at-least-32-chars";
    const now = 1_800_000_000_000;
    const token = createPasswordSessionToken(now);
    expect(verifyPasswordSessionToken(token, now + 1_000)).toBe(true);
    expect(verifyPasswordSessionToken(`${token}x`, now + 1_000)).toBe(false);
  });

  it("expires after twelve hours", () => {
    process.env.VEMO_ADMIN_SECRET = "unit-test-secret-with-at-least-32-chars";
    const now = 1_800_000_000_000;
    const token = createPasswordSessionToken(now);
    expect(verifyPasswordSessionToken(token, now + 12 * 60 * 60 * 1000 + 1_000)).toBe(false);
  });
});
