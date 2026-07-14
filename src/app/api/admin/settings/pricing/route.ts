import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const filePath = path.join(process.cwd(), "data", "vemo-pricing.json");

const defaultPricing = {
  currency: "USD",
  packs: [],
  updated_at: null as string | null,
};

async function readPricing() {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultPricing, null, 2));
    return defaultPricing;
  }
}

function arr(value: any) {
  if (Array.isArray(value)) return value.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split("\n").map((x) => x.trim()).filter(Boolean);
  return [];
}

export async function GET() {
  const pricing = await readPricing();
  return NextResponse.json({ ok: true, pricing });
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (adminCheck.ok === false) return adminCheck.response;

  try {
    const body = await request.json();

    const currency = String(body.currency || "USD").trim().toUpperCase();

    if (!Array.isArray(body.packs)) {
      return NextResponse.json(
        { ok: false, error: "Liste des packs invalide." },
        { status: 400 }
      );
    }

    const packs = body.packs.map((pack: any) => ({
      id: String(pack.id || "").trim(),
      state: String(pack.state || "").trim(),
      name_fr: String(pack.name_fr || "").trim(),
      name_en: String(pack.name_en || "").trim(),
      price: Number(pack.price || 0),
      description_fr: String(pack.description_fr || "").trim(),
      description_en: String(pack.description_en || "").trim(),
      features_fr: arr(pack.features_fr),
      features_en: arr(pack.features_en),
      active: Boolean(pack.active),
      recommended: Boolean(pack.recommended)
    }));

    for (const pack of packs) {
      if (!pack.id || !pack.name_fr || !pack.name_en) {
        return NextResponse.json(
          { ok: false, error: "Chaque pack doit avoir un identifiant et un nom FR/EN." },
          { status: 400 }
        );
      }

      if (Number.isNaN(pack.price) || pack.price < 0) {
        return NextResponse.json(
          { ok: false, error: `Prix invalide pour ${pack.name_fr}.` },
          { status: 400 }
        );
      }
    }

    const pricing = {
      currency,
      packs,
      updated_at: new Date().toISOString(),
    };

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(pricing, null, 2));

    return NextResponse.json({ ok: true, pricing });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erreur sauvegarde paramètres." },
      { status: 500 }
    );
  }
}
