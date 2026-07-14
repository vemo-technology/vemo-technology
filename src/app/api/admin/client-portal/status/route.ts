import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "data", "client-status.json");

function cleanEmail(value: any) {
  return String(value || "").trim().toLowerCase();
}

async function ensureFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "{}", "utf8");
  }
}

async function readStatuses() {
  await ensureFile();

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStatuses(statuses: Record<string, any>) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(statuses, null, 2), "utf8");
}

function defaultStatus(email: string) {
  return {
    email,
    payment_status: "En vérification",
    dossier_status: "En attente",
    current_step: "Réception du dossier",
    note: "",
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  const email = cleanEmail(request.nextUrl.searchParams.get("email"));

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email client obligatoire." }, { status: 400 });
  }

  const statuses = await readStatuses();

  return NextResponse.json({
    ok: true,
    status: statuses[email] || defaultStatus(email),
  });
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const body = await request.json().catch(() => ({}));

    const email = cleanEmail(body.email || body.client_email);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email client obligatoire." }, { status: 400 });
    }

    const statuses = await readStatuses();

    const nextStatus = {
      ...(statuses[email] || defaultStatus(email)),
      email,
      payment_status: body.payment_status || body.paymentStatus || statuses[email]?.payment_status || "En vérification",
      dossier_status: body.dossier_status || body.dossierStatus || statuses[email]?.dossier_status || "En attente",
      current_step: body.current_step || body.currentStep || statuses[email]?.current_step || "Réception du dossier",
      note: body.note ?? statuses[email]?.note ?? "",
      updated_at: new Date().toISOString(),
    };

    statuses[email] = nextStatus;
    await writeStatuses(statuses);

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erreur statut client." },
      { status: 500 }
    );
  }
}
