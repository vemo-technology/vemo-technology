import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "LEGACY_ORDER_FLOW_DISABLED",
      message:
        "Cet ancien parcours de commande est désactivé. Utilisez /fr/commencer ou /en/start.",
    },
    { status: 410 }
  );
}
