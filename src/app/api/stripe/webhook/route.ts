import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendPaidOrderEmails } from "@/lib/emails";
import { logEvent } from "@/lib/logger";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    logEvent("error", "stripe.webhook.configuration_missing");
    return NextResponse.json(
      { error: "Missing server environment variables" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logEvent("warn", "stripe.webhook.signature_missing");
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    logEvent("warn", "stripe.webhook.signature_invalid", { error });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  logEvent("info", "stripe.webhook.received", { eventType: event.type });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId || session.metadata?.order_id;
    if (orderId && session.payment_status === "paid") {
      const { data: existingOrder } = await supabaseAdmin
        .from("llc_orders")
        .select("id,amount,currency")
        .eq("id", orderId)
        .maybeSingle();
      const expectedAmount = Math.round(Number(existingOrder?.amount || 0) * 100);
      const expectedCurrency = String(existingOrder?.currency || "usd").toLowerCase();
      if (!existingOrder?.id || expectedAmount !== session.amount_total || expectedCurrency !== session.currency) {
        logEvent("warn", "stripe.webhook.payment_mismatch", { eventType: event.type });
        return NextResponse.json({ error: "Payment does not match order" }, { status: 409 });
      }
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      const { error } = await supabaseAdmin
        .from("llc_orders")
        .update({
          status: "paid",
          payment_status: "paid",
          stripe_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId || null,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      if (error) {
        logEvent("error", "stripe.webhook.order_update_failed", { eventType: event.type, error });
        return NextResponse.json({ error: "Order update failed" }, { status: 500 });
      }
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId || paymentIntent.metadata?.order_id;

    if (orderId) {
      const { data: existingOrder } = await supabaseAdmin
        .from("llc_orders")
        .select("id,amount,currency")
        .eq("id", orderId)
        .maybeSingle();
      const expectedAmount = Math.round(Number(existingOrder?.amount || 0) * 100);
      const expectedCurrency = String(existingOrder?.currency || "usd").toLowerCase();
      if (!existingOrder?.id || expectedAmount !== paymentIntent.amount_received || expectedCurrency !== paymentIntent.currency) {
        logEvent("warn", "stripe.webhook.payment_mismatch", { eventType: event.type });
        return NextResponse.json({ error: "Payment does not match order" }, { status: 409 });
      }
      const { data: order, error } = await supabaseAdmin
        .from("llc_orders")
        .update({
          status: "paid",
          payment_status: "paid",
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq("id", orderId)
        .select("*")
        .single();

      if (error) {
        logEvent("error", "stripe.webhook.order_update_failed", { eventType: event.type, error });
        return NextResponse.json({ error: "Order update failed" }, { status: 500 });
      }

      await sendPaidOrderEmails({
        orderId,
        customerEmail: order.email || paymentIntent.receipt_email || "",
        customerName: order.full_name || order.name || "Client",
        companyName: order.company_name || order.llc_name || "US LLC",
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentIntentId: paymentIntent.id,
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId || paymentIntent.metadata?.order_id;

    if (orderId) {
      await supabaseAdmin
        .from("llc_orders")
        .update({
          status: "payment_failed",
          payment_status: "failed",
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq("id", orderId);
    }
  }

  logEvent("info", "stripe.webhook.processed", { eventType: event.type });
  return NextResponse.json({ received: true });
}


