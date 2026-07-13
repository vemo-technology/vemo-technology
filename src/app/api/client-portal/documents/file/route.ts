import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

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

function contentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === ".xls") return "application/vnd.ms-excel";
  if (ext === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return "application/octet-stream";
}

function safeFileName(name: string) {
  return String(name || "document")
    .replace(/[\r\n"]/g, "")
    .trim() || "document";
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findFileRecursive(dir: string, targetBaseName: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const found = await findFileRecursive(full, targetBaseName);
        if (found) return found;
      } else {
        const entryBase = entry.name.toLowerCase();
        const targetBase = targetBaseName.toLowerCase();

        if (entryBase === targetBase || entryBase.endsWith(`-${targetBase}`) || entryBase.includes(targetBase)) {
          return full;
        }
      }
    }
  } catch {}

  return null;
}

async function resolveLocalFile(fileUrl: string, fileName: string) {
  const publicDir = path.join(process.cwd(), "public");

  if (fileUrl && !fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
    const cleanUrl = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    const directPath = path.join(publicDir, cleanUrl);

    if (await exists(directPath)) return directPath;
  }

  let baseName = "";
  try {
    const url = fileUrl.startsWith("http") ? new URL(fileUrl) : null;
    baseName = decodeURIComponent(path.basename(url ? url.pathname : fileUrl));
  } catch {
    baseName = decodeURIComponent(path.basename(fileUrl || ""));
  }

  const candidates = [
    path.join(publicDir, "uploads", "admin-documents", baseName),
    path.join(publicDir, "uploads", "client-documents", baseName),
    path.join(publicDir, "uploads", "bank-transfers", baseName),
    path.join(publicDir, "uploads", baseName),
    path.join(publicDir, "uploads", "admin-documents", fileName),
    path.join(publicDir, "uploads", "client-documents", fileName),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }

  if (baseName) {
    const found = await findFileRecursive(path.join(publicDir, "uploads"), baseName);
    if (found) return found;
  }

  if (fileName) {
    const found = await findFileRecursive(path.join(publicDir, "uploads"), fileName);
    if (found) return found;
  }

  return null;
}

async function respondBuffer(buffer: Buffer, fileName: string, mode: string) {
  const disposition =
    mode === "download"
      ? `attachment; filename="${safeFileName(fileName)}"`
      : `inline; filename="${safeFileName(fileName)}"`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType(fileName),
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const id = String(request.nextUrl.searchParams.get("id") || "").trim();
    const mode = String(request.nextUrl.searchParams.get("mode") || "view").trim();

    if (!id) {
      return new NextResponse("Document ID manquant.", { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: doc, error } = await supabase
      .from("client_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !doc) {
      return new NextResponse("Document introuvable dans la base.", { status: 404 });
    }

    const fileUrl = String(doc.file_url || doc.url || doc.public_url || "").trim();
    const fileName = safeFileName(doc.file_name || doc.title || doc.document_type || "document");

    if (!fileUrl) {
      return new NextResponse("Ce document ne contient aucun fichier.", { status: 404 });
    }

    const localFile = await resolveLocalFile(fileUrl, fileName);

    if (localFile) {
      const buffer = await fs.readFile(localFile);
      return respondBuffer(buffer, fileName || path.basename(localFile), mode);
    }

    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      const remote = await fetch(fileUrl);

      if (remote.ok) {
        const arrayBuffer = await remote.arrayBuffer();
        return respondBuffer(Buffer.from(arrayBuffer), fileName, mode);
      }

      return new NextResponse(
        `Document trouvé en base, mais le fichier distant est inaccessible. Détail: ${remote.status} ${remote.statusText}. URL enregistrée: ${fileUrl}`,
        { status: 404 }
      );
    }

    return new NextResponse(
      `Document trouvé en base, mais fichier introuvable localement. URL enregistrée: ${fileUrl}`,
      { status: 404 }
    );
  } catch (error: any) {
    return new NextResponse(error?.message || "Erreur ouverture document.", {
      status: 500,
    });
  }
}
