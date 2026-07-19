import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "This legacy endpoint is disabled. Accounts are provisioned only after server-side payment verification.",
    },
    { status: 410 },
  );
}
