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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Session client requise." },
        { status: 401 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Email invalide." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Configuration Supabase manquante : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    const authenticatedEmail = userData.user?.email?.trim().toLowerCase() || "";

    if (userError || !authenticatedEmail || authenticatedEmail !== email) {
      return NextResponse.json(
        { ok: false, error: "Session client invalide." },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    await supabase
      .from("client_accounts")
      .upsert(
        {
          email,
          portal_enabled: true,
          account_status: "active",
          updated_at: now,
        },
        { onConflict: "email" }
      );

    await supabase
      .from("client_messages")
      .insert({
        client_email: email,
        sender: "system",
        message: "Connexion client confirmée. Accès espace client activé.",
        created_at: now,
      })
      .then(() => null);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("VEMO mark-session fatal:", error?.message || error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erreur serveur mark-session." },
      { status: 500 }
    );
  }
}
