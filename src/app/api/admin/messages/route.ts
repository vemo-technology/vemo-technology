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

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ messages: [] });
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("client_messages")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ messages: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (error: any) {
    return NextResponse.json({ messages: [], error: error?.message || "Erreur messages" }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const body = await request.json();

    const email = body.email;
    const message = body.message;

    if (!email || !message) {
      return NextResponse.json({ error: "Email ou message manquant" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("client_messages")
      .insert({
        client_email: email,
        sender: "admin",
        message,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur envoi message" }, { status: 500 });
  }
}
