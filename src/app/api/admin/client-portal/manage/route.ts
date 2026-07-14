import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const DATA_PATH = join(process.cwd(), "data", "client-portal-overview.json");

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

function dossierName(email: string, portal: any) {
  return (
    portal?.profile?.llcName ||
    portal?.profile?.companyName ||
    portal?.profile?.company ||
    portal?.profile?.llc ||
    portal?.order?.llcName ||
    portal?.order?.companyName ||
    portal?.llcName ||
    portal?.companyName ||
    portal?.profile?.name ||
    "Dossier client"
  );
}

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const email = request.nextUrl.searchParams.get("email") || "";
  const data = await readData();

  if (!email) {
    const clients = Object.entries(data)
      .filter(([key]) => key.includes("@"))
      .map(([clientEmail, portal]: any) => ({
        email: clientEmail,
        label: dossierName(clientEmail, portal),
        status: portal?.status || {},
        documentsCount: Array.isArray(portal?.documents) ? portal.documents.length : 0,
        servicesCount: Array.isArray(portal?.services) ? portal.services.length : 0,
        messagesCount: Array.isArray(portal?.messages) ? portal.messages.length : 0
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({ ok: true, clients });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Email requis" }, { status: 400 });
  }

  const portal = data[email] || defaultPortal(email);

  return NextResponse.json({
    ok: true,
    email,
    label: dossierName(email, portal),
    portal
  });
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const body = await request.json();

  const email = String(body.email || "");
  const action = String(body.action || "");

  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Email requis" }, { status: 400 });
  }

  const data = await readData();
  const portal = data[email] || defaultPortal(email);

  if (action === "updateStatus") {
    portal.status = {
      payment: String(body.payment || "under_review"),
      file: String(body.file || "pending"),
      currentStep: String(body.currentStep || "file_received")
    };
  }

  if (action === "addService") {
    portal.services = Array.isArray(portal.services) ? portal.services : [];
    portal.services.unshift({
      id: `svc_${Date.now()}`,
      nameFr: String(body.nameFr || ""),
      nameEn: String(body.nameEn || ""),
      statusFr: String(body.statusFr || "Actif"),
      statusEn: String(body.statusEn || "Active"),
      value: String(body.value || ""),
      expiresAt: String(body.expiresAt || ""),
      renewalDueAt: String(body.renewalDueAt || ""),
      createdAt: new Date().toISOString()
    });
  }

  if (action === "deleteService") {
    const id = String(body.id || "");
    portal.services = Array.isArray(portal.services)
      ? portal.services.filter((item: any) => item.id !== id)
      : [];
  }

  if (action === "deleteDocument") {
    const id = String(body.id || "");
    portal.documents = Array.isArray(portal.documents)
      ? portal.documents.filter((item: any) => item.id !== id)
      : [];
  }

  if (action === "sendMessage") {
    portal.messages = Array.isArray(portal.messages) ? portal.messages : [];
    portal.messages.unshift({
      id: `msg_${Date.now()}`,
      from: "admin",
      subject: String(body.subject || ""),
      message: String(body.message || ""),
      createdAt: new Date().toISOString()
    });
  }

  data[email] = portal;
  await writeData(data);

  return NextResponse.json({
    ok: true,
    label: dossierName(email, portal),
    portal
  });
}
