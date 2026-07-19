import { NextResponse } from "next/server";
import { resolveLlcPack } from "@/lib/llcPricing";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/requestSecurity";

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request);
    if (originError) return originError;
    const rateError = enforceRateLimit(request, "llc-checkout", 10, 60 * 60 * 1000);
    if (rateError) return rateError;
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email client invalide." }, { status: 400 });
    }

    const { amount: total, name: packName } = resolvedPack;
    const form = body?.form || {};
    const customerName = String(form.fullName || form.full_name || form.name || "Client").trim();
    const companyName = String(form.llcName || form.llc_name || form.companyName || "LLC à compléter").trim();
    const supabase = createSupabaseAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("llc_orders")
      .insert({
        customer_email: email,
        customer_name: customerName,
        company_name: companyName,
        plan_name: packName,
        state: resolvedPack.state,
        amount: total,
        currency: resolvedPack.currency.toLowerCase(),
        payment_status: "pending_payment",
        status: "pending_payment",
        dossier: body,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (orderError || !order?.id) {
      return NextResponse.json({ error: "Impossible d’enregistrer la commande." }, { status: 500 });
    }

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("customer_email", email);
    params.append("payment_intent_data[receipt_email]", email);
    params.append("payment_intent_data[metadata][orderId]", order.id);
    params.append("payment_intent_data[metadata][customerEmail]", email);
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
    params.append("metadata[orderId]", order.id);
    params.append("metadata[customerName]", customerName);
    params.append("metadata[companyName]", companyName);
    params.append("metadata[lang]", lang);

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

    await supabase
      .from("llc_orders")
      .update({ stripe_session_id: data.id, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return NextResponse.json({ url: data.url });
  } catch {
    return NextResponse.json({ error: "Erreur création session Stripe." }, { status: 500 });
  }
}
