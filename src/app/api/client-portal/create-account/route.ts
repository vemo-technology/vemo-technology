import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/requestSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function POST(request: NextRequest) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;
  const rateError = enforceRateLimit(request, "client-signup", 5, 60 * 60 * 1000);
  if (rateError) return rateError;
  try {
    const body = await request.json().catch(() => ({}));

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const supabase = supabasePublic();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Service d’authentification indisponible." },
        { status: 503 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.vemo-technology.com";

    const redirectTo = `${origin}/fr/auth/callback?next=${encodeURIComponent("/fr/espace-client")}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          source: "payment_pending_verification",
          portal_enabled: true
        }
      }
    });

    if (error) {
      const msg = String(error.message || "").toLowerCase();

      if (!msg.includes("already") && !msg.includes("registered") && !msg.includes("exists")) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
      }
    }

    return NextResponse.json({
      ok: true,
      email,
      user_id: data?.user?.id || null,
      requires_email_confirmation: true,
      message: "Email de confirmation envoyé. Le client doit confirmer son email avant d’accéder à l’espace client."
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erreur création espace client."
      },
      { status: 500 }
    );
  }
}
