import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type EmbeddedCheckoutPayload = {
  amount: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  companyName?: string;
  planName?: string;
  state?: string;
  services?: string[];
  dossier?: Record<string, unknown>;
};

function normalizeEmail(email?: string | null) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email?: string | null) {
  const value = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeDossier(dossier?: Record<string, unknown>) {
  if (!dossier) return {};

  const clone = { ...dossier };

  delete clone.password;
  delete clone.cardholder;
  delete clone.paymentMethod;
  delete clone.billingName;
  delete clone.billingEmail;

  return clone;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquante dans .env.local." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = (await request.json()) as EmbeddedCheckoutPayload;

    const amount = Number(body.amount || 0);
    const currency = String(body.currency || "usd").toLowerCase();

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Montant invalide." },
        { status: 400 }
      );
    }

    const customerEmail = isValidEmail(body.customerEmail)
      ? normalizeEmail(body.customerEmail)
      : undefined;

    const customerName = String(body.customerName || "").trim();
    const companyName = String(body.companyName || "Dossier LLC").trim();
    const planName = String(body.planName || "LLC package").trim();
    const state = String(body.state || "New Mexico").trim();

    const services =
      Array.isArray(body.services) && body.services.length > 0
        ? body.services
        : [];

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin;

    const referer = request.headers.get("referer") || "";
    const locale = referer.includes("/en") ? "en" : "fr";

    let orderId = "";

    const supabase = getSupabaseAdmin();

    if (supabase) {
      const dossier = sanitizeDossier(body.dossier);

      const { data } = await supabase
        .from("llc_orders")
        .insert({
          status: "pending",
          payment_status: "unpaid",
          customer_email: customerEmail || null,
          customer_name: customerName || null,
          company_name: companyName || null,
          full_company_name: companyName || null,
          package_name: planName,
          jurisdiction: state,
          total_amount: amount,
          currency: currency.toUpperCase(),
          language: locale,
          services,
          dossier,
        })
        .select("id")
        .single();

      orderId = data?.id || "";
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page" as Stripe.Checkout.SessionCreateParams.UiMode,
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: planName,
              description: `${companyName} — ${state}`,
            },
          },
        },
      ],
      return_url: `${appUrl}/${locale === "fr" ? "fr/commencer/success" : "en/commencer/success"}?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        orderId,
        companyName,
        planName,
        state,
        services: JSON.stringify(services),
      },
      payment_intent_data: {
        metadata: {
          orderId,
          companyName,
          planName,
          state,
        },
      },
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      orderId,
    });
  } catch (error) {
    console.error("Stripe embedded checkout error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Impossible de créer la session Stripe intégrée.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
