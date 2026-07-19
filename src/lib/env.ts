const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "MAIL_FROM",
  "ADMIN_NOTIFICATION_EMAIL",
  "VEMO_ADMIN_PASSWORD",
  "VEMO_ADMIN_SECRET",
  "ADMIN_EMAILS",
] as const;

export function environmentStatus() {
  const missing = REQUIRED_SERVER_ENV.filter((name) => !String(process.env[name] || "").trim());
  const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "");
  const invalid = [] as string[];
  try {
    if (siteUrl && new URL(siteUrl).protocol !== "https:") invalid.push("NEXT_PUBLIC_SITE_URL");
  } catch {
    invalid.push("NEXT_PUBLIC_SITE_URL");
  }
  const publishableKey = String(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
  const secretKey = String(process.env.STRIPE_SECRET_KEY || "");
  if (publishableKey && !/^pk_(test|live)_/.test(publishableKey)) {
    invalid.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }
  if (secretKey && !/^sk_(test|live)_/.test(secretKey)) invalid.push("STRIPE_SECRET_KEY");
  if (
    publishableKey &&
    secretKey &&
    publishableKey.startsWith("pk_live_") !== secretKey.startsWith("sk_live_")
  ) {
    invalid.push("STRIPE_KEY_MODE_MISMATCH");
  }
  if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
    invalid.push("STRIPE_WEBHOOK_SECRET");
  }
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_")) {
    invalid.push("RESEND_API_KEY");
  }
  if ((process.env.VEMO_ADMIN_SECRET || "").length < 32) invalid.push("VEMO_ADMIN_SECRET");
  return { ok: missing.length === 0 && invalid.length === 0, missing, invalid };
}

export function assertProductionEnvironment() {
  const status = environmentStatus();
  if (process.env.NODE_ENV === "production" && !status.ok) {
    throw new Error(`Invalid production environment. Missing: ${status.missing.join(",") || "none"}; invalid: ${status.invalid.join(",") || "none"}`);
  }
  return status;
}
