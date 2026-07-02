// @ts-nocheck

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  const form = await request.formData();

  const lang = clean(form.get("lang")) || "fr";

  const client_email =
    clean(form.get("client_email")).toLowerCase() ||
    clean(form.get("manual_email")).toLowerCase();

  const client_name =
    clean(form.get("client_name")) ||
    clean(form.get("manual_name")) ||
    "Client Vemo";

  const package_name = clean(form.get("package_name")) || "New Mexico Standard";
  const amount = Number(clean(form.get("amount")) || 179);
  const reference = clean(form.get("reference")) || `VEMO-BANK-${Date.now()}`;
  const file = form.get("proof_file") as File | null;

  if (!client_email || !client_email.includes("@")) {
    return NextResponse.redirect(new URL("/fr/commencer?error=email", request.url), 303);
  }

  let proof_url = "";

  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads", "bank-transfers");
    await mkdir(uploadDir, { recursive: true });

    const finalName = `${Date.now()}-${safeFileName(file.name || "justificatif.pdf")}`;
    const finalPath = path.join(uploadDir, finalName);

    await writeFile(finalPath, bytes);
    proof_url = `/uploads/bank-transfers/${finalName}`;
  }

  const supabase = getSupabaseAdmin();

  if (supabase) {
    await supabase.from("client_payments").insert({
      client_email,
      client_name,
      package_name,
      amount,
      currency: "USD",
      payment_method: "bank_transfer",
      payment_status: "pending_verification",
      status: "pending_verification",
      reference,
      proof_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).then(() => null);
  }

  return NextResponse.redirect(
    new URL(`/fr/verification-compte?payment=verification_justificatif&email=${encodeURIComponent(client_email)}&name=${encodeURIComponent(client_name)}`, request.url),
    303
  );
}
