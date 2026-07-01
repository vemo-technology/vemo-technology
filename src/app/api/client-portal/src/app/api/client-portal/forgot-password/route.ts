import { NextResponse } from "next/server";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.vemo-technology.com";
}

function getFromEmail() {
  return (
    process.env.MAIL_FROM ||
    process.env.EMAIL_FROM ||
    "VEMO Technology <contact@vemo-technology.com>"
  );
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
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

    const siteUrl = getSiteUrl();
    const resetUrl = `${siteUrl}/fr/reinitialiser-mot-de-passe?email=${encodeURIComponent(
      email
    )}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to: email,
        subject: "Réinitialisation de votre mot de passe VEMO Technology",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Vous avez demandé à réinitialiser le mot de passe de votre espace client VEMO Technology.</p>
            <p>
              <a href="${resetUrl}" style="background:#F15A24;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">
                Choisir un nouveau mot de passe
              </a>
            </p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          </div>
        `,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Email non envoyé.",
          details: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur réinitialisation mot de passe." },
      { status: 500 }
    );
  }
}
