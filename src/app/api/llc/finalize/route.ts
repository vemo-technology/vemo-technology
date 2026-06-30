import { NextResponse } from "next/server";
import { sendVemoVerificationEmail } from "@/lib/vemoVerificationEmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "https://www.vemo-technology.com";

    const lang = body.lang === "en" ? "en" : "fr";
    const email = body?.form?.email || "";

    const portalPath = lang === "fr" ? "/fr/connexion" : "/en/connexion";
    const pendingPath = lang === "fr" ? "/fr/client" : "/en/client";

    const verifyUrl = `${origin}/api/llc/verify?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(portalPath)}&lang=${lang}`;

    await sendVemoVerificationEmail({ email, verifyUrl, lang });

    return NextResponse.json({
      ok: true,
      pendingUrl: `${origin}${pendingPath}?sent=1&email=${encodeURIComponent(email)}`,
    });
  } catch {
    return NextResponse.json({ error: "Erreur finalisation dossier." }, { status: 500 });
  }
}
