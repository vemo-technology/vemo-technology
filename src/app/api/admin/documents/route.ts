import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Variables Supabase manquantes");
  }

  return createClient(url, key);
}

function safeName(name: string) {
  return String(name || "document.pdf")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

async function insertMessage(email: string, message: string) {
  try {
    const supabase = supabaseAdmin();
    await supabase.from("client_messages").insert({
      client_email: email,
      sender: "admin",
      message,
    });
  } catch {
    // Ne bloque jamais l'upload si la table messages a un problème
  }
}

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const email = request.nextUrl.searchParams.get("email") || "";

    if (!email) {
      return NextResponse.json({ ok: true, documents: [] });
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("client_documents")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({
        ok: false,
        documents: [],
        error: error.message,
      });
    }

    return NextResponse.json({
      ok: true,
      documents: data || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      documents: [],
      error: error?.message || "Erreur chargement documents",
    });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const form = await request.formData();

    const email = String(form.get("email") || "").trim();
    const documentType = String(form.get("document_type") || "Autre document").trim();
    const replaceId = String(form.get("replace_id") || "").trim();
    const file = form.get("file");

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email client manquant." }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "Fichier manquant." }, { status: 400 });
    }

    const anyFile = file as any;

    if (!anyFile.name || typeof anyFile.arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, error: "Fichier invalide." }, { status: 400 });
    }

    const buffer = Buffer.from(await anyFile.arrayBuffer());

    if (!buffer.length) {
      return NextResponse.json({ ok: false, error: "Fichier vide." }, { status: 400 });
    }

    const finalName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeName(anyFile.name)}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "admin-documents");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, finalName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/admin-documents/${finalName}`;
    const supabase = supabaseAdmin();

    if (replaceId) {
      const { data, error } = await supabase
        .from("client_documents")
        .update({
          document_type: documentType,
          title: documentType,
          file_name: anyFile.name,
          file_url: fileUrl,
          status: "uploaded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", replaceId)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({
          ok: false,
          error: `Document enregistré localement, mais mise à jour Supabase impossible : ${error.message}`,
          file_url: fileUrl,
        }, { status: 200 });
      }

      await insertMessage(email, `Document remplacé : ${documentType}`);

      return NextResponse.json({
        ok: true,
        replaced: true,
        document: data,
        file_url: fileUrl,
      });
    }

    const { data, error } = await supabase
      .from("client_documents")
      .insert({
        client_email: email,
        document_type: documentType,
        title: documentType,
        file_name: anyFile.name,
        file_url: fileUrl,
        status: "uploaded",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({
        ok: false,
        error: `Document enregistré localement, mais insertion Supabase impossible : ${error.message}`,
        file_url: fileUrl,
      }, { status: 200 });
    }

    await insertMessage(email, `Nouveau document ajouté : ${documentType}`);

    return NextResponse.json({
      ok: true,
      uploaded: true,
      document: data,
      file_url: fileUrl,
    });
  } catch (error: any) {
    console.error("UPLOAD_DOCUMENT_ERROR", error);

    return NextResponse.json({
      ok: false,
      error: error?.message || "Erreur serveur pendant l’upload.",
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    const email = String(body.email || "");

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID document manquant." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from("client_documents")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }

    if (email) {
      await insertMessage(email, "Document supprimé du dossier.");
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Erreur suppression document",
    }, { status: 500 });
  }
}
