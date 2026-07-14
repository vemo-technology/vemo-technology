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
  const email = String(body.email || "").trim().toLowerCase();
  const message = String(body.message || "").trim();

  if (!email || !message) {
    return NextResponse.json({ ok: false, error: "Email ou message manquant." }, { status: 400 });
  }

  const inserted = await supabase.from("client_messages").insert({
    client_email: email,
    sender: "admin",
    message,
    created_at: new Date().toISOString(),
  });

  if (inserted.error) {
    return NextResponse.json({ ok: false, error: inserted.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
