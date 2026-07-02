// @ts-nocheck

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

function pick(row: any, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && clean(value)) return value;
  }

  return "";
}

function defaultPortal() {
  return {
    status: {
      payment: "under_review",
      file: "pending",
      currentStep: "file_received",
    },
    summary: {
      llc_name: "",
      package_name: "",
      state: "",
      dossier_number: "",
    },
    documents: [],
    services: [],
    messages: [],
  };
}

async function findByEmail(supabase: any, table: string, email: string) {
  const columns = [
    "client_email",
    "email",
    "customer_email",
    "billing_email",
    "owner_email",
    "user_email",
  ];

  const rows: any[] = [];
  const seen = new Set<string>();

  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, email)
        .limit(30);

      if (error || !Array.isArray(data)) continue;

      for (const row of data) {
        const key = String(row?.id || JSON.stringify(row));
        if (!seen.has(key)) {
          rows.push(row);
          seen.add(key);
        }
      }
    } catch {}
  }

  return rows;
}

function newest(rows: any[]) {
  return [...rows].sort((a, b) => {
    const da = new Date(a?.created_at || a?.updated_at || 0).getTime();
    const db = new Date(b?.created_at || b?.updated_at || 0).getTime();
    return db - da;
  })[0];
}

function normalizeDocument(row: any) {
  return {
    id: row?.id || row?.title || `doc_${Date.now()}`,
    title: pick(row, ["title", "name", "document_name", "filename"]) || "Document",
    status: pick(row, ["status", "document_status"]) || "pending",
    required: Boolean(row?.required),
    url: pick(row, ["url", "file_url", "public_url", "path", "storage_path"]),
    updatedAt: pick(row, ["updated_at", "created_at"]),
    raw: row,
  };
}

function normalizeMessage(row: any) {
  return {
    id: row?.id || `msg_${Date.now()}`,
    from: pick(row, ["sender", "from", "author"]) || "VEMO Technology",
    subject: pick(row, ["subject", "title"]) || "",
    message: pick(row, ["message", "body", "content", "text"]) || "",
    createdAt: pick(row, ["created_at", "updated_at"]),
    raw: row,
  };
}

function serviceList(main: any) {
  const services = main?.services;

  if (Array.isArray(services) && services.length > 0) {
    return services.map((name: any, index: number) => ({
      id: `service_${index}`,
      name: String(name),
      status: "included",
    }));
  }

  return [
    { id: "formation", name: "Création LLC", status: "included" },
    { id: "oa", name: "Operating Agreement", status: "included" },
    { id: "ein", name: "EIN", status: "included" },
    { id: "ra", name: "Registered Agent", status: "included" },
  ];
}

async function getPortal(email: string) {
  const supabase = supabaseAdmin();

  if (!supabase || !email.includes("@")) {
    return defaultPortal();
  }

  const orderTables = [
    "orders",
    "clients",
    "client_payments",
    "client_orders",
    "llc_orders",
    "llc_clients",
    "client_accounts",
  ];

  const allRows: any[] = [];

  for (const table of orderTables) {
    const rows = await findByEmail(supabase, table, email);
    allRows.push(...rows.map((row) => ({ ...row, __table: table })));
  }

  const main = newest(allRows) || {};

  const docRows = [
    ...(await findByEmail(supabase, "client_documents", email)),
  ];

  const messageRows = [
    ...(await findByEmail(supabase, "client_messages", email)),
  ];

  return {
    status: {
      payment:
        pick(main, ["payment_status", "status_payment", "paymentStatus"]) ||
        "under_review",
      file:
        pick(main, ["dossier_status", "order_status", "status"]) ||
        "new",
      currentStep:
        pick(main, ["current_step", "step"]) ||
        "file_received",
    },
    summary: {
      llc_name:
        pick(main, ["llc_name", "company_name", "business_name", "entity_name"]) ||
        "",
      package_name:
        pick(main, ["package_name", "pack_name", "plan_name", "plan"]) ||
        "",
      state:
        pick(main, ["state", "llc_state", "jurisdiction"]) ||
        "",
      dossier_number:
        pick(main, ["dossier_number", "order_number", "reference", "number"]) ||
        "",
      amount: pick(main, ["amount", "price", "total"]) || "",
      currency: pick(main, ["currency"]) || "USD",
    },
    documents: docRows.map(normalizeDocument),
    services: serviceList(main),
    messages: messageRows.map(normalizeMessage),
  };
}

export async function GET(request: NextRequest) {
  const email = clean(request.nextUrl.searchParams.get("email")).toLowerCase();

  const portal = await getPortal(email);

  return NextResponse.json({
    email,
    portal,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const email = clean(body.email).toLowerCase();
  const subject = clean(body.subject);
  const message = clean(body.message);

  if (!email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Email manquant." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase non configuré." },
      { status: 500 }
    );
  }

  await supabase.from("client_messages").insert({
    client_email: email,
    sender: "client",
    subject,
    message,
    message_type: "client",
    created_at: new Date().toISOString(),
  });

  const portal = await getPortal(email);

  return NextResponse.json({
    ok: true,
    portal,
  });
}
