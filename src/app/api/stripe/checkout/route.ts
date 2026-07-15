// @ts-nocheck

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const amount = Math.max(1, Number(body.amount || 179));
  const packageName = String(body.package_name || "New Mexico Standard");
  const email = String(body.email || body.client_email || "").trim().toLowerCase();
  const lang = body.lang === "en" ? "en" : "fr";

  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  if (!secretKey) {
    return NextResponse.json(
      {
        ok: false,
        message: "STRIPE_SECRET_KEY est manquant dans .env.local",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  const successPath = lang === "en" ? "/en/account-verification" : "/fr/verification-compte";
  params.set("success_url", origin + `${successPath}?payment=stripe_success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", origin + `/${lang}/stripe?payment=cancelled`);

  if (email.includes("@")) {
    params.set("customer_email", email);
  }

  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(amount * 100)));
  params.set("line_items[0][price_data][product_data][name]", packageName);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + secretKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: data?.error?.message || "Erreur Stripe Checkout",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    url: data.url,
  });
}
