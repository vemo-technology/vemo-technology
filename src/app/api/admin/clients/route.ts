import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Variables Supabase manquantes");
  }

  return createClient(url, key);
}

function pick(row: any, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function cleanStatus(value: any) {
  return String(value || "non défini").replace(/[_-]+/g, " ").trim();
}

function getEmail(row: any) {
  return String(
    pick(row, [
      "client_email",
      "email",
      "customer_email",
      "billing_email",
      "user_email",
      "owner_email",
    ])
  ).trim().toLowerCase();
}

function getLLCName(row: any) {
  return String(
    pick(row, [
      "llc_name",
      "company_name",
      "business_name",
      "company",
      "legal_name",
      "entity_name",
      "name",
      "client_name",
      "full_name",
    ])
  ).trim();
}

function normalize(row: any, source: string, index: number) {
  const email = getEmail(row);
  const llcName = getLLCName(row);

  return {
    id: row?.id || `${source}-${email || llcName || index}`,
    source,
    email,
    client_email: email,
    dossier_number: String(
      pick(row, [
        "dossier_number",
        "dossier_no",
        "dossier_ref",
        "reference",
        "order_number",
        "order_ref",
        "file_number",
        "case_number",
        "number",
      ])
    ).trim(),
    llc_name: llcName || "Sans nom LLC",
    full_name: String(pick(row, ["full_name", "client_name", "name", "customer_name"])).trim(),
    phone: String(
      pick(row, [
        "phone",
        "phone_number",
        "client_phone",
        "customer_phone",
        "telephone",
        "tel",
        "mobile",
        "whatsapp",
      ])
    ).trim(),
    state: String(pick(row, ["state", "llc_state", "jurisdiction"])).trim(),
    package_name: String(pick(row, ["package_name", "pack_name", "selected_pack", "plan"])).trim(),
    amount: pick(row, ["amount", "price", "total"]),
    currency: String(pick(row, ["currency"]) || "USD").trim(),
    payment_status: cleanStatus(
      pick(row, [
        "payment_status",
        "status_payment",
        "paymentStatus",
        "payment_state",
        "payment_status_label",
      ])
    ),
    dossier_status: cleanStatus(
      pick(row, [
        "dossier_status",
        "account_status",
        "portal_status",
        "order_status",
        "status",
      ])
    ),
    created_at:
      pick(row, [
        "created_at",
        "createdAt",
        "order_date",
        "payment_date",
        "date",
        "updated_at",
      ]) || null,
    raw: row,
  };
}

async function safeSelect(supabase: any, table: string) {
  try {
    const ordered = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });

    if (!ordered.error) {
      return { table, rows: ordered.data || [], error: null };
    }

    const plain = await supabase.from(table).select("*");

    if (!plain.error) {
      return { table, rows: plain.data || [], error: null };
    }

    return { table, rows: [], error: plain.error.message || ordered.error.message };
  } catch (e: any) {
    return { table, rows: [], error: e?.message || "Erreur inconnue" };
  }
}

function makeDossierNumber(createdAt: string | null, index: number) {
  let year = new Date().getFullYear();

  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) year = d.getFullYear();
  }

  return `VEMO-${year}-${String(index + 1).padStart(5, "0")}`;
}

function betterValue(oldValue: any, newValue: any) {
  if (oldValue !== undefined && oldValue !== null && String(oldValue).trim() !== "" && oldValue !== "non défini") {
    return oldValue;
  }
  return newValue;
}

export async function GET(request: Request) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const supabase = supabaseAdmin();

    const tables = [
      "orders",
      "clients",
      "client_payments",
      "client_orders",
      "llc_orders",
      "llc_clients",
      "client_accounts",
      "profiles",
    ];

    const sources = await Promise.all(tables.map((t) => safeSelect(supabase, t)));
    const merged = new Map<string, any>();

    for (const source of sources) {
      source.rows.forEach((row: any, index: number) => {
        const item = normalize(row, source.table, index);

        if (!item.email && (!item.llc_name || item.llc_name === "Sans nom LLC")) return;

        const key = item.email || item.llc_name.toLowerCase();
        const existing = merged.get(key);

        if (!existing) {
          merged.set(key, item);
          return;
        }

        merged.set(key, {
          ...existing,
          dossier_number: betterValue(existing.dossier_number, item.dossier_number),
          llc_name: betterValue(existing.llc_name !== "Sans nom LLC" ? existing.llc_name : "", item.llc_name),
          full_name: betterValue(existing.full_name, item.full_name),
          phone: betterValue(existing.phone, item.phone),
          state: betterValue(existing.state, item.state),
          package_name: betterValue(existing.package_name, item.package_name),
          amount: betterValue(existing.amount, item.amount),
          currency: betterValue(existing.currency, item.currency),
          payment_status: betterValue(existing.payment_status, item.payment_status),
          dossier_status: betterValue(existing.dossier_status, item.dossier_status),
          created_at: existing.created_at || item.created_at,
          raw: { ...existing.raw, ...item.raw },
        });
      });
    }

    const clients = Array.from(merged.values())
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      })
      .map((client, index) => ({
        ...client,
        dossier_number: client.dossier_number || makeDossierNumber(client.created_at, index),
      }));

    return NextResponse.json({
      ok: true,
      clients,
      count: clients.length,
      debug: sources.map((s) => ({
        table: s.table,
        count: s.rows.length,
        error: s.error,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        clients: [],
        error: error?.message || "Impossible de charger les clients.",
      },
      { status: 200 }
    );
  }
}
