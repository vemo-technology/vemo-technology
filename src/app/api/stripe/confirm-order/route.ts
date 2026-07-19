// @ts-nocheck
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sendVemoVerificationEmail } from "@/lib/vemoVerificationEmail";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/requestSecurity";

export const runtime = "nodejs";

function normalizeEmail(email?: string | null) {
  return String(email || "").trim().toLowerCase();
}

async function ensureDefaultDocuments(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  orderId: string,
  email: string
) {
  const docs = [
    { title: "Questionnaire LLC", status: "completed", required: false },
    { title: "Operating Agreement", status: "in_progress", required: false },
    { title: "EIN / IRS", status: "pending", required: false },
    { title: "Pièce d'identité du membre", status: "pending", required: true },
    { title: "Justificatif d'adresse", status: "pending", required: true },
    { title: "Documents société", status: "pending", required: false },
  ];

  for (const doc of docs) {
    const { data: existing } = await supabase
      .from("client_documents")
      .select("id")
      .eq("order_id", orderId)
      .eq("title", doc.title)
      .maybeSingle();

    if (!existing?.id) {
      await supabase.from("client_documents").insert({
        order_id: orderId,
        client_email: email,
        title: doc.title,
        status: doc.status,
        required: doc.required,
        admin_comment: doc.required
          ? "Document requis pour poursuivre le traitement du dossier."
          : null,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

async function ensureWelcomeMessages(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  orderId: string,
  email: string
) {
  const { data: existing } = await supabase
    .from("client_messages")
    .select("id")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (!existing?.id) {
    await supabase.from("client_messages").insert([
      {
        order_id: orderId,
        client_email: email,
        sender: "Vemo Technology",
        message:
          "Votre paiement est confirmé. Votre dossier LLC est lancé. Merci d'activer votre compte client et de vérifier les documents requis.",
        message_type: "success",
      },
      {
        order_id: orderId,
        client_email: email,
        sender: "Admin Vemo",
        message:
          "Nous allons vérifier les informations transmises. Si une information ou un document manque, vous le verrez directement dans cet espace.",
        message_type: "info",
      },
    ]);
  }
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request);
    if (originError) return originError;
    const rateError = enforceRateLimit(request, "confirm-stripe-order", 20, 60 * 60 * 1000);
    if (rateError) return rateError;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquante." },
        { status: 500 }
      );
    }

    const { sessionId } = (await request.json()) as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId manquant." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createSupabaseAdminClient();

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Paiement non confirmé.",
          paymentStatus: session.payment_status,
        },
        { status: 400 }
      );
    }

    const customerEmail = normalizeEmail(
      session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.customerEmail ||
        session.metadata?.email ||
        ""
    );

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Email client introuvable dans Stripe." },
        { status: 400 }
      );
    }

    const customerName =
      session.customer_details?.name ||
      session.metadata?.customerName ||
      "Client";

    const companyName = session.metadata?.companyName || "Dossier LLC";
    const planName = session.metadata?.planName || "Standard";
    const state = session.metadata?.state || "New Mexico";
    const amount =
      typeof session.amount_total === "number" ? session.amount_total / 100 : 179;

    let orderId = session.metadata?.orderId || "";
    let order: any = null;

    if (!orderId) {
      return NextResponse.json({ error: "La session Stripe n’est liée à aucune commande VEMO." }, { status: 409 });
    }

    if (orderId) {
      const { data: orderData } = await supabase
        .from("llc_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (!orderData?.id) {
        return NextResponse.json({ error: "Commande VEMO introuvable." }, { status: 404 });
      }
      const expectedAmount = Math.round(Number(orderData.amount || orderData.total_amount || 0) * 100);
      if (!session.amount_total || session.amount_total !== expectedAmount) {
        return NextResponse.json({ error: "Le montant Stripe ne correspond pas à la commande." }, { status: 409 });
      }

      const { data: updatedOrder } = await supabase
        .from("llc_orders")
        .update({
          status: "paid",
          payment_status: "paid",
          stripe_session_id: session.id,
          customer_email: customerEmail,
          customer_name: customerName,
          company_name: orderData?.company_name || companyName,
          plan_name: orderData?.plan_name || planName,
          state: orderData?.state || state,
          amount: orderData?.amount || amount,
          currency: "usd",
          missing_items: orderData?.missing_items || [
            "Pièce d'identité du membre",
            "Justificatif d'adresse"
          ],
          paid_at: orderData?.paid_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select("*")
        .single();

      order = updatedOrder || orderData;
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Impossible de créer ou retrouver la commande." },
        { status: 500 }
      );
    }

    const { data: existingAccount } = await supabase
      .from("client_accounts")
      .select("id, activation_email_sent_at")
      .eq("email", customerEmail)
      .maybeSingle();

    if (existingAccount?.id) {
      const { error: updateError } = await supabase
        .from("client_accounts")
        .update({
          order_id: orderId,
          full_name: customerName,
          company_name: order?.company_name || companyName,
          plan_name: order?.plan_name || planName,
          status: "pending_activation",
          portal_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccount.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("Account update error:", updateError);
      }

    } else {
      const { error: insertError } = await supabase
        .from("client_accounts")
        .insert({
          order_id: orderId,
          email: customerEmail,
          full_name: customerName,
          company_name: order?.company_name || companyName,
          plan_name: order?.plan_name || planName,
          status: "pending_activation",
          portal_enabled: true,
          email_confirmed: false,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Account insert error:", insertError);
      }

    }

    await ensureDefaultDocuments(supabase, orderId, customerEmail);
    await ensureWelcomeMessages(supabase, orderId, customerEmail);

    const lang = session.metadata?.lang === "en" ? "en" : "fr";
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
    let activationEmailSent = Boolean(existingAccount?.activation_email_sent_at);
    if (!activationEmailSent) {
      const userList = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingUser = userList.data?.users?.find(
        (user) => normalizeEmail(user.email) === customerEmail
      );
      if (!existingUser) {
        await supabase.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
          user_metadata: { full_name: customerName, company_name: companyName },
        });
      }
      const callbackPath = `/${lang}/auth/callback?next=${encodeURIComponent(
        lang === "fr" ? "/fr/espace-client" : "/en/client-portal"
      )}`;
      const generated = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: customerEmail,
        options: { redirectTo: `${siteUrl}${callbackPath}` },
      });
      const actionLink = generated.data?.properties?.action_link;
      if (actionLink) {
        const sent = await sendVemoVerificationEmail({
          email: customerEmail,
          verifyUrl: actionLink,
          lang,
        });
        activationEmailSent = sent.ok;
        if (sent.ok) {
          await supabase
            .from("client_accounts")
            .update({ activation_email_sent_at: new Date().toISOString() })
            .eq("email", customerEmail);
        }
      }
    }
    const portalUrl = lang === "fr" ? "/fr/espace-client" : "/en/client-portal";

    return NextResponse.json({
      ok: true,
      orderId,
      customerEmail,
      portalUrl,
      activationEmailSent,
    });
  } catch (error: unknown) {
    console.error("Confirm order error:", error);

    const message =
      error instanceof Error ? error.message : "Erreur inconnue.";

    return NextResponse.json(
      {
        error: "Impossible de confirmer le paiement.",
        details: message,
      },
      { status: 500 }
    );
  }
}
