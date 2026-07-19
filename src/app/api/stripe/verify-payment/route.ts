import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint remplacé par la confirmation de commande sécurisée." },
    { status: 410 }
  );
}
