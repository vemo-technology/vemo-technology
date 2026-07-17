import { NextResponse } from "next/server";
import { resolveLlcPack } from "@/lib/llcPricing";

async function sendVerificationEmail(email: string, verifyUrl: string, lang: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "VEMO Technology <onboarding@resend.dev>";

  if (!apiKey || !email) return { sent: false };

  const subject = lang === "fr" ? "Confirmez votre compte VEMO Technology" : "Confirm your VEMO Technology account";
  const html = lang === "fr"
    ? `<p>Bonjour,</p><p>Merci de confirmer votre compte VEMO Technology.</p><p><a href="${verifyUrl}">Confirmer mon compte</a></p>`
    : `<p>Hello,</p><p>Please confirm your VEMO Technology account.</p><p><a href="${verifyUrl}">Confirm my account</a></p>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: email, subject, html }),
  });

  return { sent: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resolvedPack = await resolveLlcPack(body);

    if (!resolvedPack) {
      return NextResponse.json(
        { error: "Pack LLC invalide ou tarif indisponible." },
        { status: 400 }
      );
    }

    const secret = process.env.STRIPE_SECRET_KEY;

    if (!secret) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquant dans Vercel." },
        { status: 400 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "https://www.vemo-technology.com";

    const lang = body.lang === "fr" ? "fr" : "en";
    const email = body?.form?.email || "";
    const portalPath = body.clientPortalUrl || (lang === "fr" ? "/fr/client" : "/en/client");
    const verifyUrl = `${origin}/api/llc/verify?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(portalPath)}&lang=${lang}`;
    await sendVerificationEmail(email, verifyUrl, lang);

    const { amount: total, name: packName } = resolvedPack;

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("customer_email", email);
    params.append("payment_intent_data[receipt_email]", email);
    params.append("success_url", `${origin}/${lang === "fr" ? "fr/paiement/success" : "en/payment/success"}?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(lang === "fr" ? "/fr/client" : "/en/client")}&lang=${lang}`);
    params.append("cancel_url", `${origin}/${lang === "fr" ? "fr/commencer" : "en/start"}?payment=cancelled`);
    params.append("line_items[0][quantity]", "1");
    params.append(
      "line_items[0][price_data][currency]",
      resolvedPack.currency.toLowerCase()
    );
    params.append("line_items[0][price_data][unit_amount]", String(Math.round(total * 100)));
    params.append("line_items[0][price_data][product_data][name]", `VEMO Technology — ${packName}`);
    params.append("line_items[0][price_data][product_data][description]", "US LLC formation service");
    params.append("client_reference_id", email);
    params.append("metadata[email]", email);
    params.append("metadata[pack]", packName);
    params.append("metadata[state]", resolvedPack.state);
    params.append("metadata[pack_id]", resolvedPack.id);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await stripeRes.json();

    if (!stripeRes.ok) {
      return NextResponse.json({ error: data?.error?.message || "Stripe error." }, { status: 400 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    return NextResponse.json({ error: "Erreur création session Stripe." }, { status: 500 });
  }
}
