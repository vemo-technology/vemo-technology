import { NextResponse } from "next/server";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/requestSecurity";
import { createClient } from "@supabase/supabase-js";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.vemo-technology.com";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/vemo/forgot-password",
  });
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;
  const rateError = enforceRateLimit(request, "forgot-password", 5, 60 * 60 * 1000);
  if (rateError) return rateError;
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim();

    if (!email) {
      return NextResponse.json(
        { error: "Adresse email obligatoire." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const redirectTo = `${siteUrl()}/fr/reinitialiser-mot-de-passe`;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message || "Impossible d’envoyer l’email de réinitialisation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erreur serveur.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
