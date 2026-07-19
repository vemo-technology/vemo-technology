// @ts-nocheck

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function safeName(name: string) {
  return String(name || "document")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function POST(request: Request) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const supabase = adminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase admin non configuré." }, { status: 500 });
    }

    const form = await request.formData();
    const email = String(form.get("client_email") || "").trim().toLowerCase();
    const documentType = String(form.get("document_type") || "other").trim();
    const replaceId = String(form.get("replace_document_id") || "").trim();
    const file = form.get("file");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Email client invalide." }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "Fichier manquant." }, { status: 400 });
    }

    const bucket = "client-documents";
    await supabase.storage.createBucket(bucket, { public: false }).then(() => null);
    await supabase.storage.updateBucket(bucket, { public: false }).then(() => null);

    const fileName = safeName(file.name);
    const storagePath = `${email}/${Date.now()}-${fileName}`;
    const arrayBuffer = await file.arrayBuffer();

    const upload = await supabase.storage
      .from(bucket)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (upload.error) {
      return NextResponse.json({ ok: false, error: upload.error.message }, { status: 500 });
    }

    if (replaceId) {
      await supabase
        .from("client_documents")
        .update({
          title: file.name,
          document_type: documentType,
          file_name: file.name,
          file_url: null,
          storage_path: storagePath,
          status: "replaced",
          updated_at: new Date().toISOString(),
        })
        .eq("id", replaceId);

      return NextResponse.json({ ok: true, mode: "replaced" });
    }

    const inserted = await supabase.from("client_documents").insert({
      client_email: email,
      title: file.name,
      document_type: documentType,
      file_name: file.name,
      file_url: null,
      storage_path: storagePath,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (inserted.error) {
      return NextResponse.json({ ok: false, error: inserted.error.message }, { status: 500 });
    }

    await supabase.from("client_messages").insert({
      client_email: email,
      sender: "admin",
      message: `Nouveau document ajouté : ${file.name}`,
      created_at: new Date().toISOString(),
    }).then(() => null);

    return NextResponse.json({ ok: true, mode: "created" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erreur upload document." }, { status: 500 });
  }
}
