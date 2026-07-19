import { logEvent } from "@/lib/logger";

type SendVemoVerificationEmailInput = {
  email: string;
  verifyUrl: string;
  lang?: string;
};

function fromEmail() {
  return (
    process.env.MAIL_FROM ||
    process.env.EMAIL_FROM ||
    "VEMO Technology <contact@vemo-technology.com>"
  );
}

export async function sendVemoVerificationEmail({
  email,
  verifyUrl,
  lang = "fr",
}: SendVemoVerificationEmailInput) {
  const resendKey = process.env.RESEND_API_KEY;

  if (!email || !resendKey) {
    logEvent("warn", "resend.verification_skipped", {
      hasEmail: Boolean(email),
      hasResendKey: Boolean(resendKey),
    });
    return { ok: false };
  }

  const subject =
    lang === "en"
      ? "Confirm your VEMO Technology client account"
      : "Confirmez votre compte client VEMO Technology";

  const title =
    lang === "en"
      ? "Confirm your email address"
      : "Confirmez votre adresse email";

  const text =
    lang === "en"
      ? "Click the button below to activate your client account."
      : "Cliquez sur le bouton ci-dessous pour activer votre compte client.";

  const button =
    lang === "en"
      ? "Activate my account"
      : "Activer mon compte";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail(),
      to: email,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <h2>${title}</h2>
          <p>${text}</p>
          <p>
            <a href="${verifyUrl}" style="display:inline-block;background:#F15A24;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">
              ${button}
            </a>
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    logEvent("error", "resend.verification_failed", { status: response.status });
    return { ok: false };
  }

  logEvent("info", "resend.verification_sent");
  return { ok: true };
}
