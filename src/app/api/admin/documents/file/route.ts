import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function safeFileName(value: unknown) {
  const name = String(value || "document")
    .replace(/[\r\n"]/g, "")
    .trim();

  return name || "document";
}

function contentType(fileName: string, storedMime: unknown) {
  const mime = String(storedMime || "").trim().toLowerCase();

  if (mime) return mime;

  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lower.endsWith(".webp")) return "image/webp";

  return "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);

  if (adminCheck.ok === false) {
    return adminCheck.response;
  }

  const id = String(
    request.nextUrl.searchParams.get("id") || ""
  ).trim();

  const mode =
    request.nextUrl.searchParams.get("mode") === "download"
      ? "download"
      : "view";

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "ID document manquant." },
      { status: 400 }
    );
  }

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

  const { data: document, error } = await supabase
    .from("client_documents")
    .select(
      "id, file_name, file_url, storage_path, mime_type, document_type"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !document) {
    return NextResponse.json(
      { ok: false, error: "Document introuvable." },
      { status: 404 }
    );
  }

  const storagePath = String(
    document.storage_path || ""
  ).trim();

  if (!storagePath) {
    return NextResponse.json(
      {
        ok: false,
        error: "Chemin de stockage privé manquant.",
      },
      { status: 404 }
    );
  }

  const buckets = storagePath.startsWith("bank-transfers/")
    ? ["payment-proofs"]
    : ["client-documents", "payment-proofs"];

  let downloaded: Blob | null = null;

  for (const bucket of buckets) {
    const result = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (!result.error && result.data) {
      downloaded = result.data;
      break;
    }
  }

  if (!downloaded) {
    return NextResponse.json(
      {
        ok: false,
        error: "Fichier privé introuvable.",
      },
      { status: 404 }
    );
  }

  const fileName = safeFileName(
    document.file_name ||
    document.document_type ||
    "document"
  );

  const disposition =
    mode === "download" ? "attachment" : "inline";

  const buffer = Buffer.from(
    await downloaded.arrayBuffer()
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType(
        fileName,
        document.mime_type
      ),
      "Content-Disposition":
        `${disposition}; filename="${fileName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
