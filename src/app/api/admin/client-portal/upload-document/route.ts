import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, extname, join } from "path";

export const dynamic = "force-dynamic";

const DATA_PATH = join(process.cwd(), "data", "client-portal-overview.json");
const UPLOAD_DIR = join(process.cwd(), "public", "client-documents");

async function readData(): Promise<Record<string, any>> {
  try {
    return JSON.parse(await readFile(DATA_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function writeData(data: Record<string, any>) {
  await mkdir(dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}

function defaultPortal(email: string) {
  return {
    profile: {
      name: "Client VEMO",
      email,
      llcName: "Dossier client",
      passwordUpdatedAt: null
    },
    status: {
      payment: "under_review",
      file: "pending",
      currentStep: "file_received"
    },
    documents: [],
    services: [],
    messages: []
  };
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const form = await request.formData();

  const email = String(form.get("email") || "");
  const title = String(form.get("title") || "");
  const documentId = String(form.get("documentId") || "");
  const file = form.get("file");

  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "FILE_REQUIRED" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const originalName = file.name || "document.pdf";
  const safeExt = extname(originalName) || ".pdf";
  const safeName = `${Date.now()}-${email.replace(/[^a-zA-Z0-9]/g, "-")}${safeExt}`;
  const diskPath = join(UPLOAD_DIR, safeName);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, bytes);

  const data = await readData();
  const portal = data[email] || defaultPortal(email);

  portal.documents = Array.isArray(portal.documents) ? portal.documents : [];

  const nextDoc = {
    id: documentId || `doc_${Date.now()}`,
    name: title || originalName,
    title: title || originalName,
    filename: originalName,
    url: `/client-documents/${safeName}`,
    fileUrl: `/client-documents/${safeName}`,
    uploadedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  if (documentId) {
    const index = portal.documents.findIndex((item: any) => item.id === documentId);
    if (index >= 0) {
      portal.documents[index] = {
        ...portal.documents[index],
        ...nextDoc
      };
    } else {
      portal.documents.unshift(nextDoc);
    }
  } else {
    portal.documents.unshift(nextDoc);
  }

  data[email] = portal;
  await writeData(data);

  return NextResponse.json({
    ok: true,
    portal
  });
}
