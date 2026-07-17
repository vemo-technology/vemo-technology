import { readFile } from "fs/promises";
import path from "path";

type CatalogPack = {
  id: string;
  state: string;
  name: string;
  price: string | number;
};

export type ResolvedLlcPack = {
  id: string;
  state: "New Mexico" | "Wyoming";
  name: string;
  amount: number;
  currency: "USD";
};

const CATALOG_FILE = path.join(process.cwd(), "data", "llc-packs.json");

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeState(value: unknown) {
  const normalized = clean(value).toLowerCase().replace(/[^a-z]/g, "");

  if (normalized.includes("newmexico") || normalized === "nm") {
    return { prefix: "nm", name: "New Mexico" as const };
  }

  if (normalized.includes("wyoming") || normalized === "wy") {
    return { prefix: "wy", name: "Wyoming" as const };
  }

  return null;
}

function normalizePack(value: unknown) {
  const normalized = clean(value).toLowerCase().replace(/[^a-z]/g, "");

  if (normalized.includes("starter")) return "starter";
  if (normalized.includes("standard")) return "standard";
  if (normalized.includes("premium") || normalized.includes("advanced")) {
    return "premium";
  }

  return null;
}

function firstResolved<T>(
  values: unknown[],
  resolver: (value: unknown) => T | null
) {
  for (const value of values) {
    const resolved = resolver(value);
    if (resolved) return resolved;
  }

  return null;
}

export async function resolveLlcPack(
  body: any
): Promise<ResolvedLlcPack | null> {
  const state = firstResolved(
    [
      body?.form?.state,
      body?.state,
      body?.llc_state,
      body?.jurisdiction,
      body?.pack?.state,
      body?.selectedPack?.state,
      body?.package_name,
      body?.pack?.name,
    ],
    normalizeState
  );

  const packKey = firstResolved(
    [
      body?.form?.pack,
      body?.pack_id,
      body?.packId,
      body?.package_name,
      body?.plan_name,
      body?.plan,
      body?.pack?.id,
      body?.pack?.name,
      body?.selectedPack?.id,
      body?.selectedPack?.name,
    ],
    normalizePack
  );

  if (!state || !packKey) return null;

  let catalog: CatalogPack[];

  try {
    const raw = await readFile(CATALOG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    catalog = Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }

  const expectedId = `${state.prefix}-${packKey}`;
  const record = catalog.find(
    (item) => clean(item.id).toLowerCase() === expectedId
  );

  if (!record) return null;

  const amount = Number(record.price);

  if (!Number.isFinite(amount) || amount <= 0) return null;

  return {
    id: clean(record.id),
    state: state.name,
    name: clean(record.name),
    amount,
    currency: "USD",
  };
}
