// @ts-nocheck

import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const supabase = adminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase admin non configuré." }, { status: 500 });
  }

  const clients = await supabase
    .from("client_accounts")
    .select("*")
    .order("updated_at", { ascending: false })
    .then((r) => r.data || []);

  const documents = await supabase
    .from("client_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .then((r) => r.data || []);

  const messages = await supabase
    .from("client_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .then((r) => r.data || []);

  return NextResponse.json({ ok: true, clients, documents, messages });
}
