import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const EXTENSIONS_BY_MIME: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

function supabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function fileExtension(name: string) {
  const normalized = String(name || "").trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

function detectMime(buffer: Buffer) {
  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  ) {
    return "application/pdf";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return "";
}

function normalizeDeclaredMime(value: string) {
  const mime = String(value || "").trim().toLowerCase();
  return mime === "image/jpg" ? "image/jpeg" : mime;
}

function validateFileMetadata(file: File) {
  if (!file.name || file.size <= 0) {
    return "Justificatif manquant ou vide.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Le justificatif dépasse la limite de 8 Mo.";
  }

  const extension = fileExtension(file.name);
  const declaredMime = normalizeDeclaredMime(file.type);

  const extensionAllowed = Object.values(EXTENSIONS_BY_MIME)
    .flat()
    .includes(extension);

  if (!extensionAllowed) {
    return "Format non autorisé. Utilisez PDF, PNG, JPG, JPEG ou WEBP.";
  }

  if (declaredMime && !EXTENSIONS_BY_MIME[declaredMime]) {
    return "Type de fichier non autorisé.";
  }

  return "";
}

async function dossierBelongsToEmail(
  supabase: ReturnType<typeof supabaseAdmin>,
  dossierNumber: string,
  email: string
) {
  if (!supabase) return false;

  for (const table of ["orders", "client_payments"]) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("dossier_number", dossierNumber)
      .limit(1)
      .maybeSingle();

    if (error || !data) continue;

    const owner = String(
      data.client_email ||
      data.email ||
      data.customer_email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (owner === email) return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Configuration Supabase sécurisée manquante.",
        },
        { status: 500 }
      );
    }

    const form = await request.formData();

    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();

    const dossierNumber = String(
      form.get("dossier_number") || ""
    ).trim();

    const file = form.get("file");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Email client invalide." },
        { status: 400 }
      );
    }

    if (!/^VEMO-\d{4}-\d{6}$/.test(dossierNumber)) {
      return NextResponse.json(
        { ok: false, error: "Numéro de dossier invalide." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Justificatif manquant." },
        { status: 400 }
      );
    }

    const metadataError = validateFileMetadata(file);

    if (metadataError) {
      return NextResponse.json(
        { ok: false, error: metadataError },
        { status: 400 }
      );
    }

    const authorized = await dossierBelongsToEmail(
      supabase,
      dossierNumber,
      email
    );

    if (!authorized) {
      return NextResponse.json(
        {
          ok: false,
          error: "Le dossier ne correspond pas à cet email.",
        },
        { status: 403 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectMime(buffer);

    if (!detectedMime) {
      return NextResponse.json(
        {
          ok: false,
          error: "Le contenu du fichier n’est pas un PDF ou une image valide.",
        },
        { status: 400 }
      );
    }

    const extension = fileExtension(file.name);
    const allowedExtensions = EXTENSIONS_BY_MIME[detectedMime] || [];

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        {
          ok: false,
          error: "L’extension ne correspond pas au contenu du fichier.",
        },
        { status: 400 }
      );
    }

    const declaredMime = normalizeDeclaredMime(file.type);

    if (declaredMime && declaredMime !== detectedMime) {
      return NextResponse.json(
        {
          ok: false,
          error: "Le type déclaré ne correspond pas au contenu du fichier.",
        },
        { status: 400 }
      );
    }

    const canonicalExtension = allowedExtensions[0];
    const storagePath =
      `bank-transfers/${dossierNumber}/` +
      `${randomUUID()}${canonicalExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, buffer, {
        contentType: detectedMime,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Impossible de stocker le justificatif.",
        },
        { status: 500 }
      );
    }

    const { data: document, error: documentError } = await supabase
      .from("client_documents")
      .insert({
        client_email: email,
        title: "Justificatif de virement",
        document_type: "Justificatif de virement",
        file_name: file.name,
        file_url: null,
        storage_path: storagePath,
        mime_type: detectedMime,
        size_bytes: file.size,
        status: "pending_verification",
        dossier_number: dossierNumber,
        uploaded_by: "client",
      })
      .select("id")
      .single();

    if (documentError || !document?.id) {
      await supabase.storage
        .from("payment-proofs")
        .remove([storagePath]);

      return NextResponse.json(
        {
          ok: false,
          error: "Impossible d’enregistrer le justificatif.",
        },
        { status: 500 }
      );
    }

    const internalFileUrl =
      `/api/admin/documents/file?id=${encodeURIComponent(document.id)}`;

    const { error: linkError } = await supabase
      .from("client_documents")
      .update({
        file_url: internalFileUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    if (linkError) {
      await supabase
        .from("client_documents")
        .delete()
        .eq("id", document.id);

      await supabase.storage
        .from("payment-proofs")
        .remove([storagePath]);

      return NextResponse.json(
        {
          ok: false,
          error: "Impossible de sécuriser l’accès au justificatif.",
        },
        { status: 500 }
      );
    }

    for (const table of ["orders", "client_payments"]) {
      await supabase
        .from(table)
        .update({
          payment_status: "pending_verification",
          dossier_status: "payment_pending_verification",
          status: "pending_verification",
          updated_at: new Date().toISOString(),
        })
        .eq("dossier_number", dossierNumber)
        .eq("client_email", email);
    }

    await supabase
      .from("client_messages")
      .insert({
        client_email: email,
        sender: "vemo",
        message:
          "Justificatif de virement reçu. Paiement en attente de vérification.",
      })
      .then(() => null);

    return NextResponse.json({
      ok: true,
      dossier_number: dossierNumber,
      document_id: document.id,
    });
  } catch (error) {
    console.error("Bank transfer proof upload error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Erreur lors de l’envoi du justificatif.",
      },
      { status: 500 }
    );
  }
}
