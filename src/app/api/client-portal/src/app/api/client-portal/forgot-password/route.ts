import { NextResponse } from "next/server";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.vemo-technology.com";
}

function fromEmail() {
  return (
    process.env.MAIL_FROM ||
    process.env.EMAIL_FROM ||
    "VEMO Technology <contact@vemo-technology.com>"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();

    if (!email) {
      return NextResponse.json(
        { error: "Adresse email obligatoire." },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY manquante dans Vercel." },
        { status: 500 }
      );
    }

    const resetUrl = `${siteUrl()}/fr/reinitialiser-mot-de-passe?email=${encodeURIComponent(
      email
    )}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail(),
        to: email,
        subject: "Réinitialisation de votre mot de passe VEMO Technology",
        html: `
          <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe VEMO Technology.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block;background:#F15A24;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">
                Choisir un nouveau mot de passe
              </a>
            </p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          </div>
        `,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            "Email non envoyé. Vérifiez RESEND_API_KEY, MAIL_FROM et le domaine Resend.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
