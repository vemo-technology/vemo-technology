import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "LEGACY_PROOF_UPLOAD_DISABLED",
      message:
        "Cet ancien point d’envoi est désactivé. Utilisez le parcours LLC sécurisé avec un numéro de dossier.",
    },
    { status: 410 }
  );
}
