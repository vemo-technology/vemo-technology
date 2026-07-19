import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/adminAuth";

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

function normalize(row: any, source: string) {
  const email = row?.client_email || row?.email || row?.customer_email || "";
  const llcName =
    row?.llc_name ||
    row?.company_name ||
    row?.business_name ||
    row?.desired_name ||
    row?.name ||
    "Dossier LLC";

  return {
    id: row?.id || row?.order_id || row?.payment_id || email || Math.random().toString(36),
    source,
    email,
    clientEmail: email,
    llcName,
    clientName: row?.client_name || row?.full_name || row?.name || "",
    state: row?.state || row?.formation_state || row?.llc_state || "—",
    plan: row?.plan || row?.pack || row?.formula || row?.package || "—",
    amount: row?.amount || row?.price || row?.total || row?.total_amount || null,
    paymentStatus:
      row?.payment_status ||
      row?.status ||
      row?.payment_state ||
      row?.account_status ||
      "pending_verification",
    dossierStatus:
      row?.dossier_status ||
      row?.file_status ||
      row?.case_status ||
      row?.account_status ||
      "pending",
    createdAt: row?.created_at || row?.createdAt || row?.date || "",
    raw: row,
  };
}

export async function GET(request: Request) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const supabase = supabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Service de données indisponible." },
      { status: 503 }
    );
  }

  const tables = ["orders", "client_payments", "clients"];
  const all: any[] = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) {
        for (const row of data) all.push(normalize(row, table));
      }
    } catch {}
  }

  const byKey = new Map<string, any>();

  for (const item of all) {
    const key = item.email || item.llcName || item.id;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, item);
    } else {
      byKey.set(key, {
        ...existing,
        ...item,
        raw: {
          ...existing.raw,
          ...item.raw,
        },
      });
    }
  }

  const items = Array.from(byKey.values()).sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );

  return NextResponse.json({
    ok: true,
    items,
  });
}
