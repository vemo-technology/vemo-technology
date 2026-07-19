import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const body = await request.json().catch(() => ({}));

    const id = String(body.id || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const paymentStatus = String(body.paymentStatus || "").trim();
    const dossierStatus = String(body.dossierStatus || "").trim();

    if (!id && !email) {
      return NextResponse.json({ ok: false, error: "ID ou email obligatoire." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Service de données indisponible." },
        { status: 503 }
      );
    }

    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus) patch.payment_status = paymentStatus;
    if (dossierStatus) patch.dossier_status = dossierStatus;

    const tables = ["orders", "client_payments", "clients"];
    const results: any[] = [];

    for (const table of tables) {
      try {
        let query = supabase.from(table).update(patch);

        if (email) {
          query = query.or(`email.eq.${email},client_email.eq.${email}`);
        } else {
          query = query.eq("id", id);
        }

        const { error } = await query;
        results.push({ table, ok: !error, error: error?.message || null });
      } catch (e: any) {
        results.push({ table, ok: false, error: e?.message || "Erreur" });
      }
    }

    return NextResponse.json({
      ok: true,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erreur mise à jour admin.",
      },
      { status: 500 }
    );
  }
}
