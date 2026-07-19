import { NextResponse } from "next/server";

type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();

function clientAddress(request: Request) {
  return (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${clientAddress(request)}`;
  const current = counters.get(key);
  const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  entry.count += 1;
  counters.set(key, entry);

  if (counters.size > 5_000) {
    for (const [candidate, value] of counters) if (value.resetAt <= now) counters.delete(candidate);
  }

  if (entry.count <= limit) return null;
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) } },
  );
}

export function enforceSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const requestOrigin = new URL(request.url).origin;
  let configured = requestOrigin;
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) configured = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
  } catch {
    return NextResponse.json({ error: "Invalid server origin configuration." }, { status: 503 });
  }
  if (origin === requestOrigin || origin === configured) return null;
  return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
}
