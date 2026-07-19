import { afterEach, describe, expect, it } from "vitest";
import { environmentStatus } from "@/lib/env";

describe("production environment validation", () => {
  const snapshot = { ...process.env };
  afterEach(() => { process.env = { ...snapshot }; });

  it("does not expose secret values and reports missing names", () => {
    for (const key of Object.keys(process.env)) {
      if (/SUPABASE|STRIPE|RESEND|VEMO_ADMIN|NEXT_PUBLIC_SITE_URL/.test(key)) delete process.env[key];
    }
    const status = environmentStatus();
    expect(status.ok).toBe(false);
    expect(status.missing).toContain("STRIPE_SECRET_KEY");
    expect(status.missing).toContain("MAIL_FROM");
    expect(status.missing).toContain("ADMIN_NOTIFICATION_EMAIL");
  });

  it("rejects mixed Stripe modes and malformed provider keys", () => {
    const valid = {
      NEXT_PUBLIC_SITE_URL: "https://www.vemo-technology.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_public",
      STRIPE_SECRET_KEY: "sk_test_secret",
      STRIPE_WEBHOOK_SECRET: "not-a-webhook-secret",
      RESEND_API_KEY: "not-a-resend-key",
      MAIL_FROM: "VEMO <contact@vemo-technology.com>",
      ADMIN_NOTIFICATION_EMAIL: "admin@vemo-technology.com",
      VEMO_ADMIN_PASSWORD: "a-long-password",
      VEMO_ADMIN_SECRET: "x".repeat(32),
      ADMIN_EMAILS: "admin@vemo-technology.com",
    };
    Object.assign(process.env, valid);
    const status = environmentStatus();
    expect(status.invalid).toContain("STRIPE_KEY_MODE_MISMATCH");
    expect(status.invalid).toContain("STRIPE_WEBHOOK_SECRET");
    expect(status.invalid).toContain("RESEND_API_KEY");
  });
});
