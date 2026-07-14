import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data", "client-documents.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "client-documents");

type ClientDocument = {
  id: string;
  email: string;
  client_email: string;
  title: string;
  name: string;
  filename: string;
  url: string;
  public_url: string;
  file_path: string;
  path: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  visible_to_client: boolean;
  created_at: string;
  updated_at: string;
};

function cleanEmail(value: any) {
  return String(value || "").trim().toLowerCase();
}

function safeFileName(value: string) {
  return String(value || "document")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function ensureFiles() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readDocuments(): Promise<ClientDocument[]> {
  await ensureFiles();

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeDocuments(documents: ClientDocument[]) {
  await ensureFiles();
  await fs.writeFile(DATA_FILE, JSON.stringify(documents, null, 2), "utf8");
}

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const email = cleanEmail(request.nextUrl.searchParams.get("email"));
  const documents = await readDocuments();

  if (!email) {
    return NextResponse.json({ ok: true, documents });
  }

  return NextResponse.json({
    ok: true,
    documents: documents
      .filter((doc) => cleanEmail(doc.email || doc.client_email) === email)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
  });
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const form = await request.formData();

    const email = cleanEmail(form.get("email") || form.get("client_email"));
    const title = String(form.get("title") || "").trim();
    const replaceId = String(form.get("replace_id") || form.get("id") || "").trim();
    const file = form.get("file") as File | null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email client obligatoire." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ ok: false, error: "Fichier obligatoire." }, { status: 400 });
    }

    await ensureFiles();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const finalName = `${Date.now()}-${safeFileName(file.name)}`;
    const emailDir = path.join(UPLOAD_DIR, email);
    await fs.mkdir(emailDir, { recursive: true });

    const diskPath = path.join(emailDir, finalName);
    await fs.writeFile(diskPath, buffer);

    const publicUrl = `/uploads/client-documents/${encodeURIComponent(email)}/${encodeURIComponent(finalName)}`;
    const now = new Date().toISOString();

    const documents = await readDocuments();

    if (replaceId) {
      const index = documents.findIndex((doc) => String(doc.id) === replaceId);

      if (index >= 0) {
        documents[index] = {
          ...documents[index],
          title: title || file.name,
          name: title || file.name,
          filename: file.name,
          url: publicUrl,
          public_url: publicUrl,
          file_path: publicUrl,
          path: publicUrl,
          mime_type: file.type || null,
          size_bytes: file.size || null,
          visible_to_client: true,
          updated_at: now,
        };

        await writeDocuments(documents);
        return NextResponse.json({ ok: true, document: documents[index] });
      }
    }

    const document: ClientDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      email,
      client_email: email,
      title: title || file.name,
      name: title || file.name,
      filename: file.name,
      url: publicUrl,
      public_url: publicUrl,
      file_path: publicUrl,
      path: publicUrl,
      mime_type: file.type || null,
      size_bytes: file.size || null,
      visible_to_client: true,
      created_at: now,
      updated_at: now,
    };

    documents.unshift(document);
    await writeDocuments(documents);

    return NextResponse.json({ ok: true, document });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erreur upload document." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID document obligatoire." }, { status: 400 });
    }

    const documents = await readDocuments();
    const next = documents.filter((doc) => String(doc.id) !== id);
    await writeDocuments(next);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erreur suppression document." },
      { status: 500 }
    );
  }
}
