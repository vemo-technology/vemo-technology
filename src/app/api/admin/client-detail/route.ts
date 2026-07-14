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

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: Request) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const supabase = adminClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin non configuré." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = String(searchParams.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Email client manquant." },
      { status: 400 }
    );
  }

  const clientRes = await supabase
    .from("client_accounts")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (clientRes.error) {
    return NextResponse.json(
      { ok: false, error: clientRes.error.message },
      { status: 500 }
    );
  }

  if (!clientRes.data) {
    return NextResponse.json(
      { ok: false, error: "Client introuvable." },
      { status: 404 }
    );
  }

  const documents = await supabase
    .from("client_documents")
    .select("*")
    .eq("client_email", email)
    .order("created_at", { ascending: false })
    .then((r) => r.data || []);

  const messages = await supabase
    .from("client_messages")
    .select("*")
    .eq("client_email", email)
    .order("created_at", { ascending: false })
    .then((r) => r.data || []);

  return NextResponse.json({
    ok: true,
    client: clientRes.data,
    documents,
    messages,
  });
}
