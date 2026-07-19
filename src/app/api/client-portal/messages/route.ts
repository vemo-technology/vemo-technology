import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyClientRequest } from "@/lib/clientAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  const auth = await verifyClientRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 500 });

  const { data, error } = await supabase
    .from("client_messages")
    .select("id,sender,subject,message,content,direction,is_read,created_at")
    .eq("client_email", auth.email)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  return NextResponse.json({ ok: true, messages: data || [] });
}

export async function POST(request: Request) {
  const auth = await verifyClientRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => ({}));
  const subject = String(body.subject || "Client message").trim().slice(0, 160);
  const message = String(body.message || body.content || "").trim();
  if (!message || message.length > 10_000) {
    return NextResponse.json({ error: "Message must contain between 1 and 10000 characters." }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  const { data, error } = await supabase
    .from("client_messages")
    .insert({
      client_email: auth.email,
      sender: "client",
      subject,
      message,
      content: message,
      direction: "client_to_admin",
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select("id,sender,subject,message,content,direction,is_read,created_at")
    .single();
  if (error) return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  return NextResponse.json({ ok: true, message: data });
}
