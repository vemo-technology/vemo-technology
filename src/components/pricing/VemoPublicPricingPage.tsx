import Link from "next/link";
import { VEMO_LLC_PACKS, getVemoLlcPackFeatures, getVemoLlcPackPrice } from "@/lib/vemoLlcPacks";

type Locale = "fr" | "en";
type PackId = "starter" | "standard" | "premium";
type StateName = "New Mexico" | "Wyoming";

const PACK_ORDER: PackId[] = ["starter", "standard", "premium"];
const STATE_ORDER: StateName[] = ["New Mexico", "Wyoming"];

const LABELS = {
  fr: {
    pageTitle: "Tarifs LLC",
    pageSubtitle:
      "Choisissez la formule adaptée à votre projet. Les offres New Mexico et Wyoming sont affichées séparément pour une lecture plus claire.",
    states: {
      "New Mexico": "New Mexico",
      Wyoming: "Wyoming",
    },
    descriptions: {
      starter: "L’essentiel pour créer votre LLC.",
      standard: "La formule recommandée pour démarrer sérieusement.",
      premium: "L’offre complète pour structurer votre activité.",
    },
    cta: "Commencer",
    renewalTitle: "Renouvellement Registered Agent",
    renewalWy: "Wyoming : 25 USD / an",
    renewalNm: "New Mexico : 35 USD / an",
    included: "Inclus dans le pack",
  },
  en: {
    pageTitle: "LLC Pricing",
    pageSubtitle:
      "Choose the plan that fits your project. New Mexico and Wyoming offers are displayed separately for better clarity.",
    states: {
      "New Mexico": "New Mexico",
      Wyoming: "Wyoming",
    },
    descriptions: {
      starter: "Essential offer to launch your LLC.",
      standard: "Recommended offer to start with stronger support.",
      premium: "Complete offer to structure your business.",
    },
    cta: "Start now",
    renewalTitle: "Registered Agent Renewal",
    renewalWy: "Wyoming: 25 USD / year",
    renewalNm: "New Mexico: 35 USD / year",
    included: "Included in the plan",
  },
} as const;

function safePrice(packId: string, state: string) {
  try {
    const value = getVemoLlcPackPrice(packId as any, state as any);
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  } catch {
    return 0;
  }
}

function safeFeatures(packId: string, state: string) {
  try {
    const byState = getVemoLlcPackFeatures(packId as any, state as any);
    if (Array.isArray(byState) && byState.length) return byState;
  } catch {}
  try {
    const generic = getVemoLlcPackFeatures(packId as any, state as any);
    if (Array.isArray(generic) && generic.length) return generic;
  } catch {}
  const pack = (VEMO_LLC_PACKS as any[]).find((item) => item.id === packId);
  if (Array.isArray(pack?.features)) return pack.features;
  if (Array.isArray(pack?.included)) return pack.included;
  if (Array.isArray(pack?.services)) return pack.services;
  return [];
}

function cleanFeatures(features: string[]) {
  return features
    .filter(Boolean)
    .filter(
      (item) =>
        !/renouvellement registered agent/i.test(item) &&
        !/registered agent renewal/i.test(item)
    )
    .slice(0, 7);
}

function buildHref(locale: Locale, packId: PackId, state: StateName, price: number) {
  const stateSlug = state === "New Mexico" ? "new-mexico" : "wyoming";
  const packName =
    state === "New Mexico"
      ? `New Mexico ${packId.charAt(0).toUpperCase() + packId.slice(1)}`
      : `Wyoming ${packId.charAt(0).toUpperCase() + packId.slice(1)}`;

  return `/${locale === "fr" ? "fr/commencer" : "en/start"}?pack=${stateSlug}_${packId}&packName=${encodeURIComponent(
    packName
  )}&state=${stateSlug}&amount=${price}&currency=USD`;
}

function PackCard({
  locale,
  packId,
  state,
}: {
  locale: Locale;
  packId: PackId;
  state: StateName;
}) {
  const t = LABELS[locale];
  const price = safePrice(packId, state);
  const features = cleanFeatures(safeFeatures(packId, state));
  const title = packId.charAt(0).toUpperCase() + packId.slice(1);
  const isRecommended = packId === "standard";

  return (
    <div className="rounded-[28px] border border-[#E7EEF6] bg-white p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-black uppercase tracking-[0.22em] text-[#8DA2BD]">
            {t.states[state]}
          </div>
          <h3 className="mt-2 text-[36px] font-black leading-none text-[#123A63]">
            {title}
          </h3>
          <p className="mt-4 text-[16px] font-semibold leading-8 text-[#5B7191]">
            {t.descriptions[packId]}
          </p>
        </div>

        {isRecommended ? (
          <div className="shrink-0 rounded-full border border-[#F15A24] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#F15A24]">
            {locale === "fr" ? "Recommandé" : "Recommended"}
          </div>
        ) : null}
      </div>

      <div className="mb-6 rounded-[20px] border border-[#E7EEF6] bg-white px-5 py-4">
        <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#8DA2BD]">
          {t.included}
        </div>
        <div className="mt-3 text-[40px] font-black leading-none text-[#F15A24]">
          {price} USD
        </div>
      </div>

      <div className="space-y-3">
        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-start gap-3 rounded-[18px] border border-[#E7EEF6] bg-white px-4 py-3"
          >
            <span className="mt-[2px] text-[14px] font-black text-[#F15A24]">✓</span>
            <span className="text-[15px] font-bold leading-6 text-[#123A63]">{feature}</span>
          </div>
        ))}
      </div>

      <Link
        href={buildHref(locale, packId, state, price)}
        className="mt-6 inline-flex w-full items-center justify-center rounded-[18px] border border-[#F15A24] bg-[#F15A24] px-5 py-4 text-[15px] font-black text-white transition hover:opacity-95"
      >
        {t.cta}
      </Link>
    </div>
  );
}

export default function VemoPublicPricingPage({ locale = "fr" }: { locale?: Locale }) {
  const t = LABELS[locale];

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-7xl px-6 py-14 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="text-[12px] font-black uppercase tracking-[0.24em] text-[#F15A24]">
            {locale === "fr" ? "Tarifs" : "Pricing"}
          </div>
          <h1 className="mt-4 text-[44px] font-black leading-tight text-[#111827] md:text-[56px]">
            {t.pageTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-[18px] leading-8 text-[#5B7191]">
            {t.pageSubtitle}
          </p>
        </div>

        <div className="mt-14 space-y-14">
          {STATE_ORDER.map((state) => (
            <section key={state}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-[32px] font-black text-[#123A63]">{t.states[state]}</h2>
                <div className="h-px flex-1 bg-[#E7EEF6]" />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {PACK_ORDER.map((packId) => (
                  <PackCard key={`${state}-${packId}`} locale={locale} state={state} packId={packId} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-14 rounded-[28px] border border-[#E7EEF6] bg-white p-6 md:p-8">
          <h3 className="text-[28px] font-black text-[#123A63]">{t.renewalTitle}</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-[#E7EEF6] bg-white p-5">
              <div className="text-[12px] font-black uppercase tracking-[0.20em] text-[#8DA2BD]">
                Wyoming
              </div>
              <div className="mt-3 text-[28px] font-black text-[#F15A24]">25 USD</div>
              <div className="mt-2 text-[15px] font-semibold text-[#5B7191]">
                {locale === "fr" ? "Par an" : "Per year"}
              </div>
            </div>

            <div className="rounded-[22px] border border-[#E7EEF6] bg-white p-5">
              <div className="text-[12px] font-black uppercase tracking-[0.20em] text-[#8DA2BD]">
                New Mexico
              </div>
              <div className="mt-3 text-[28px] font-black text-[#F15A24]">35 USD</div>
              <div className="mt-2 text-[15px] font-semibold text-[#5B7191]">
                {locale === "fr" ? "Par an" : "Per year"}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
