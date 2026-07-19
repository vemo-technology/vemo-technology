import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/adminAuth";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Variables Supabase manquantes");
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const body = await request.json();

    const email = body.email;
    const payment_status = body.payment_status;
    const account_status = body.account_status;
    const dossier_status = body.dossier_status;

    if (!email) {
      return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const patch: Record<string, string> = {};
    if (payment_status) patch.payment_status = payment_status;
    if (account_status) patch.account_status = account_status;
    if (dossier_status) patch.status = dossier_status;

    const results: any[] = [];

    for (const table of ["orders", "client_payments", "clients"]) {
      try {
        const { error } = await supabase.from(table).update(patch).eq("client_email", email);
        results.push({ table, ok: !error, error: error?.message || null });
      } catch (e: any) {
        results.push({ table, ok: false, error: e?.message || "Erreur" });
      }
    }

    await supabase.from("client_messages").insert({
      client_email: email,
      sender: "admin",
      message: `Statut mis à jour : ${payment_status || account_status || dossier_status}`,
    });

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur statut dossier" }, { status: 500 });
  }
}
