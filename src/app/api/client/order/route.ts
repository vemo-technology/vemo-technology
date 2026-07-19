import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Endpoint remplacé par /api/client-portal/order." },
    { status: 410 }
  );
}
