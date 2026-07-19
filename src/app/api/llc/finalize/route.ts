// @ts-nocheck

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveLlcPack } from "@/lib/llcPricing";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function clean(value: any) {
  return String(value ?? "").trim();
}

function getValue(body: any, keys: string[]) {
  const sources = [
    body,
    body?.form,
    body?.owner,
    body?.member,
    body?.pack,
    body?.package,
    body?.selectedPack,
    body?.payment,
    body?.summary,
  ].filter(Boolean);

  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];

      if (value === undefined || value === null) continue;

      if (typeof value === "object") {
        const nested =
          value.email ||
          value.name ||
          value.label ||
          value.title ||
          value.value ||
          value.id;

        if (nested !== undefined && nested !== null && clean(nested)) {
          return clean(nested);
        }
      }

      if (clean(value)) return clean(value);
    }
  }

  return "";
}

function dossierNumber() {
  const d = new Date();
  const year = d.getFullYear();
  const stamp = `${d.getTime()}`.slice(-6);
  return `VEMO-${year}-${stamp}`;
}

function normalizePaymentMethod(value: string) {
  const v = value.toLowerCase();

  if (
    v.includes("bank") ||
    v.includes("virement") ||
    v.includes("transfer") ||
    v.includes("wire")
  ) {
    return "bank_transfer";
  }

  return "card";
}

async function safeInsert(supabase: any, table: string, payloads: any[]) {
  for (const payload of payloads) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select("*")
        .single();

      if (!error) {
        return { table, ok: true, id: data?.id || null };
      }

      console.error(`Insert ${table} failed:`, error.message);
    } catch (error: any) {
      console.error(`Insert ${table} exception:`, error?.message || String(error));
    }
  }

  return { table, ok: false };
}

async function saveDossier(body: any) {
  const supabase = supabaseAdmin();
  const dossier = dossierNumber();
  const resolvedPack = await resolveLlcPack(body);

  if (!resolvedPack) {
    return {
      ok: false,
      error: "Pack LLC invalide ou tarif indisponible.",
      dossier_number: dossier,
    };
  }

  const email = getValue(body, [
    "email",
    "client_email",
    "customer_email",
    "billing_email",
    "owner_email",
    "user_email",
  ]).toLowerCase();

  const fullName =
    getValue(body, ["full_name", "client_name", "customer_name", "name", "owner_name"]) ||
    "Client VEMO";

  const llcName =
    getValue(body, [
      "llc_name",
      "llcName",
      "company_name",
      "companyName",
      "business_name",
      "businessName",
      "entity_name",
    ]) || "LLC à compléter";

  const state = resolvedPack.state;
  const packageName = resolvedPack.name;
  const amount = resolvedPack.amount;
  const currency = resolvedPack.currency;

  const paymentMethod = normalizePaymentMethod(
    getValue(body, ["payment_method", "paymentMethod", "method", "payment"]) || "card"
  );

  const paymentStatus =
    paymentMethod === "bank_transfer" ? "pending_verification" : "pending_payment";

  const status =
    paymentMethod === "bank_transfer" ? "pending_verification" : "pending_payment";

  const now = new Date().toISOString();

  if (!email || !email.includes("@")) {
    return {
      ok: false,
      error: "Email client invalide.",
      dossier_number: dossier,
    };
  }

  if (!supabase) {
    return {
      ok: false,
      error: "Supabase non configuré.",
      dossier_number: dossier,
    };
  }

  const commonPayload = {
    client_email: email,
    email,
    customer_email: email,
    owner_email: email,

    client_name: fullName,
    full_name: fullName,
    customer_name: fullName,

    llc_name: llcName,
    company_name: llcName,
    business_name: llcName,

    state,
    llc_state: state,
    jurisdiction: state,

    package_name: packageName,
    pack_name: packageName,
    plan_name: packageName,
    plan: packageName,

    amount,
    currency,

    payment_method: paymentMethod,
    payment_status: paymentStatus,
    dossier_status: "new",
    status,

    dossier_number: dossier,
    order_number: dossier,
    reference: dossier,

    raw_payload: body,
    created_at: now,
    updated_at: now,
  };

  const llcOrderPayload = {
    customer_email: email,
    customer_name: fullName,
    company_name: llcName,
    plan_name: packageName,
    state,
    amount,
    currency: currency.toLowerCase(),
    payment_status: paymentStatus,
    status,
    dossier: body,
    services: [
      "LLC formation",
      "Operating Agreement",
      "EIN",
      "Registered Agent",
      "Suivi administratif",
    ],
    missing_items: [
      "Pièce d'identité du membre",
      "Justificatif d'adresse",
    ],
    updated_at: now,
  };

  const results = [];

  results.push(await safeInsert(supabase, "orders", [commonPayload]));
  results.push(await safeInsert(supabase, "clients", [commonPayload]));
  results.push(await safeInsert(supabase, "client_payments", [commonPayload]));
  results.push(await safeInsert(supabase, "llc_orders", [llcOrderPayload, commonPayload]));

  try {
    await supabase.from("client_messages").insert({
      client_email: email,
      sender: "VEMO Technology",
      message:
        paymentMethod === "bank_transfer"
          ? "En attente de vérification du justificatif de paiement."
          : "Dossier créé. Paiement par carte en attente.",
      message_type: "info",
      created_at: now,
    });
  } catch {}

  return {
    ok: true,
    email,
    fullName,
    llcName,
    packageName,
    amount,
    currency,
    paymentMethod,
    paymentStatus,
    dossier_number: dossier,
    results,
  };
}

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request);
    if (originError) return originError;
    const rateError = enforceRateLimit(request, "llc-finalize", 10, 60 * 60 * 1000);
    if (rateError) return rateError;
    const body = await request.json().catch(() => ({}));

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "https://www.vemo-technology.com";

    const lang = body.lang === "en" ? "en" : "fr";

    const saved = await saveDossier(body);

    if (!saved.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: saved.error || "Impossible de créer le dossier.",
        },
        { status: 400 }
      );
    }

    const pendingPath = lang === "fr"
      ? "/fr/payment-pending-verification"
      : "/en/payment-pending-verification";

    return NextResponse.json({
      ok: true,
      dossier_number: saved.dossier_number,
      pendingUrl: `${origin}${pendingPath}?sent=1&email=${encodeURIComponent(saved.email)}`,
      saved,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erreur finalisation dossier.",
      },
      { status: 500 }
    );
  }
}
