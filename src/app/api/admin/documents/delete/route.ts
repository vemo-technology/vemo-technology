// @ts-nocheck

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase admin non configuré." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  const storagePath = String(body.storage_path || "");

  if (!id) {
    return NextResponse.json({ ok: false, error: "ID document manquant." }, { status: 400 });
  }

  if (storagePath) {
    await supabase.storage.from("client-documents").remove([storagePath]).then(() => null);
  }

  const deleted = await supabase.from("client_documents").delete().eq("id", id);

  if (deleted.error) {
    return NextResponse.json({ ok: false, error: deleted.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
