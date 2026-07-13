// @ts-nocheck

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Email invalide" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_URL manquant.",
    }, { status: 500 });
  }

  const users = await supabase.auth.admin.listUsers();
  const user = users?.data?.users?.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    return NextResponse.json({
      ok: false,
      found: false,
      email,
      message: "Utilisateur introuvable dans Supabase Auth.",
    });
  }

  return NextResponse.json({
    ok: true,
    found: true,
    email,
    id: user.id,
    confirmed_at: user.confirmed_at,
    email_confirmed_at: user.email_confirmed_at,
    last_sign_in_at: user.last_sign_in_at,
    created_at: user.created_at,
  });
}
