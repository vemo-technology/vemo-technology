import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "This legacy checkout endpoint is disabled. Use the server-priced LLC checkout flow.",
    },
    { status: 410 },
  );
}
