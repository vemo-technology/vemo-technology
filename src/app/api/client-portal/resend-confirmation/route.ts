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
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const originError = enforceSameOrigin(request);
  if (originError) return originError;
  const rateError = enforceRateLimit(request, "resend-confirmation", 3, 60 * 60 * 1000);
  if (rateError) return rateError;
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 });
    }

    const supabase = supabasePublic();

    if (!supabase) {
      return NextResponse.json({
        ok: false,
        error: "Supabase non configuré.",
      }, { status: 500 });
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.vemo-technology.com";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/fr/auth/callback?next=${encodeURIComponent("/fr/espace-client")}`,
      },
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Erreur renvoi confirmation.",
    }, { status: 500 });
  }
}
