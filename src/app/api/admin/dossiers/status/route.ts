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
  const status = String(body.status || "").trim();

  if (!email || !status) {
    return NextResponse.json({ ok: false, error: "Email ou statut manquant." }, { status: 400 });
  }

  const paymentStatuses = ["pending_verification", "paid", "rejected"];
  const patch = paymentStatuses.includes(status)
    ? { payment_status: status, updated_at: new Date().toISOString() }
    : { account_status: status, updated_at: new Date().toISOString() };

  const updated = await supabase
    .from("client_accounts")
    .upsert({ email, ...patch }, { onConflict: "email" });

  if (updated.error) {
    return NextResponse.json({ ok: false, error: updated.error.message }, { status: 500 });
  }

  await supabase.from("client_messages").insert({
    client_email: email,
    sender: "admin",
    message: `Statut mis à jour : ${status}`,
    created_at: new Date().toISOString(),
  }).then(() => null);

  return NextResponse.json({ ok: true });
}
