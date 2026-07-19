import { NextResponse } from "next/server";
import { environmentStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const environment = environmentStatus();
  return NextResponse.json(
    {
      ok: environment.ok,
      service: "vemo-technology",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    { status: environment.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
