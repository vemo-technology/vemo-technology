"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { VEMO_COUNTRIES, flagFromIso, type VemoCountry } from "@/lib/vemoCountries";
import { VEMO_LLC_PACKS, getVemoLlcPackFeatures, getVemoLlcPackPrice } from "@/lib/vemoLlcPacks";

function translateEnServiceLabel(value: string) {
  const label = String(value || "");

  const dictionary: Record<string, string> = {
    "LLC formation documents": "LLC formation documents",
    "LLC formation documents": "LLC formation documents",
    "EIN application": "EIN application",
    "US phone number included for 3 months": "US phone number included for 3 months",
    "US phone number included for 3 months": "US phone number included for 3 months",
    "Shopify included for 3 months + 1-year domain name": "Shopify included for 3 months + 1-year domain name",
    "Shopify included for 3 months + 1-year domain name": "Shopify included for 3 months + 1-year domain name",
    "Shopify included for 3 months + 1-year domain name": "Shopify included for 3 months + 1-year domain name",
    "Shopify included for 3 months + 1-year domain name": "Shopify included for 3 months + 1-year domain name",
    "Stripe / PayPal assistance": "Stripe / PayPal assistance",
    "Wise / Mercury / Payoneer assistance": "Wise / Mercury / Payoneer assistance",
  };

  return dictionary[label] || label;
}

function translateEnServiceList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => translateEnServiceLabel(String(item))).join(", ");
  }

  return translateEnServiceLabel(String(value || "—"));
}

type Lang = "fr" | "en";
type PlanId = "" | "starter" | "standard" | "premium";
type PaymentMethod = "card" | "bank_transfer";

type Plan = {
  id: Exclude<PlanId, "">;
  label: string;
  subtitle: string;
  features: string[];
  recommended?: boolean;
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const plans: Plan[] = VEMO_LLC_PACKS.map((pack) => ({
  id: pack.id,
  label: pack.label,
  subtitle: pack.shortDescription,
  features: pack.features,
  recommended: pack.recommended,
}));

const FORMULA_PREVIEW: Record<
  "starter" | "standard" | "premium",
  {
    subtitle: string;
    bullets: string[];
  }
> = {
  starter: {
    subtitle: "The essentials to launch your LLC.",
    bullets: [
      "LLC formation",
      "Filing fees included",
      "Registered Agent included for 1 year",
    ],
  },
  standard: {
    subtitle: "The recommended package for most non-residents.",
    bullets: [
      "Everything in Starter +",
      "EIN application",
      "Stripe + Mercury assistance",
    ],
  },
  premium: {
    subtitle: "The complete offer to structure your business.",
    bullets: [
      "Everything in Standard +",
      "Outils de payment internationaux",
      "Shopify included for 3 months + domain for 1 year",
    ],
  },
};

const activitySectors = [
  "E-commerce",
  "Services digitaux",
  "Consulting / Business services",
  "Software / SaaS",
  "Marketing / Advertising",
  "Formation / Coaching",
  "Import / Export",
  "Holding / Investment",
  "Travel / Tourism",
  "Autre activity",
];

const designators = ["LLC", "L.L.C.", "Limited Liability Company"];

const countryNamesFr: Record<string, string> = {
  MA: "Maroc",
  DZ: "Algérie",
  FR: "France",
  AE: "Émirats arabes unis",
  SA: "Arabie saoudite",
  US: "States-Unis",
  GB: "Royaume-Uni",
  ES: "Espagne",
  IT: "Italie",
  DE: "Allemagne",
  BE: "Belgique",
  NL: "Country-Bas",
  PT: "Portugal",
  TR: "Turquie",
  TN: "Tunisie",
  EG: "Égypte",
  CA: "Canada",
  CN: "Chine",
  JP: "Japon",
  KR: "Corée du Sud",
  QA: "Qatar",
  KW: "Koweït",
  OM: "Oman",
  BH: "Bahreïn",
  JO: "Jordanie",
  LB: "Liban",
  SN: "Sénégal",
  CI: "Côte d’Ivoire",
  CM: "Cameroun",
  NG: "Nigeria",
};

const content = {
  fr: {
    home: "Accueil",
    pricing: "Tarifs",
    faq: "FAQ",
    contact: "Contact",
    start: "Start",
    next: "Continue",
    back: "← Back",
    summary: "Summary",
    progress: "Progress",
    company: "Your LLC company",
    estimated: "Estimated total",
    finalNote: "The final amount may be adjusted depending on the services actually required.",
    included: "Included",
    toComplete: "À compléter",
    recommended: "Recommandé",
    steps: ["State", "Package", "LLC name", "Activity", "Account", "Members", "Address", "Services", "Summary", "Payment"],
  },
  en: {
    home: "Home",
    pricing: "Pricing",
    faq: "FAQ",
    contact: "Contact",
    start: "Start",
    next: "Continue",
    back: "← Back",
    summary: "Summary",
    progress: "Progress",
    company: "Your LLC company",
    estimated: "Estimated total",
    finalNote: "The final amount may be adjusted depending on the services actually required.",
    included: "Included",
    toComplete: "To complete",
    recommended: "Recommended",
    steps: ["State", "Package", "LLC name", "Activity", "Account", "Members", "Address", "Services", "Summary", "Payment"],
  },
};

function countryDisplayName(country: VemoCountry, lang: Lang = "fr") {
  if (lang === "fr") return countryNamesFr[country.iso] || country.name;
  return country.name;
}

function inputClass() {
  return "h-[54px] w-full rounded-[16px] border border-[#E1E7EF] bg-white px-4 text-sm font-black text-[#123A63] outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10";
}

function textareaClass() {
  return "min-h-[120px] w-full rounded-[16px] border border-[#E1E7EF] bg-white px-4 py-4 text-sm font-bold text-[#123A63] outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10";
}

function syncedPlanPrice(planId: string, state: string) {
  return syncedPlanPrice(planId, state);
}

function syncedPlanFeatures(planId: string, state: string) {
  return syncedPlanFeatures(planId, state);
}

function visibleSelectableServices(services: string[]) {
  const hiddenKeywords = [
    "Documents de formation LLC",
    "Frais de dépôt",
    "Renouvellement Registered Agent",
    "Registered Agent offert",
  ];

  return services.filter((service) => {
    return !hiddenKeywords.some((keyword) =>
      service.toLowerCase().includes(keyword.toLowerCase())
    );
  });
}

function emailIsValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

function phoneIsValid(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

function slugPlanToPlan(pack?: string | null): PlanId {
  const raw = String(pack || "").toLowerCase();
  if (raw.includes("premium")) return "premium";
  if (raw.includes("starter")) return "starter";
  if (raw.includes("standard")) return "standard";
  return "";
}

function findCountryByDial(value: string) {
  const cleaned = value.trim();
  return [...VEMO_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((country) => cleaned.startsWith(country.dial));
}

function CountryPicker({
  label,
  valueIso,
  onChange,
  compact = false,
  lang = "fr",
}: {
  label: string;
  valueIso: string;
  onChange: (country: VemoCountry) => void;
  compact?: boolean;
  lang?: Lang;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = VEMO_COUNTRIES.find((c) => c.iso === valueIso) || VEMO_COUNTRIES.find((c) => c.iso === "MA")!;

  const filtered = VEMO_COUNTRIES.filter((country) => {
    const q = search.toLowerCase().trim();
    const fr = countryDisplayName(country, "fr").toLowerCase();
    const en = country.name.toLowerCase();

    if (!q) return true;

    return (
      fr.includes(q) ||
      en.includes(q) ||
      country.dial.includes(q) ||
      country.iso.toLowerCase().includes(q)
    );
  }).slice(0, 80);

  return (
    <div className="relative">
      {label ? <span className="mb-2 block text-sm font-black text-[#123A63]">{translateEnServiceLabel(String(label))}</span> : null}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-[54px] w-full rounded-[16px] border border-[#E1E7EF] bg-white px-4 text-left text-sm font-black text-[#123A63] outline-none transition hover:border-[#F15A24]/50"
      >
        {compact ? (
          <span className="flex items-center justify-center gap-2">
            <span>{flagFromIso(selected.iso)}</span>
            <span>{selected.dial}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>{flagFromIso(selected.iso)}</span>
            <span className="truncate">{countryDisplayName(selected, lang)}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[320px] rounded-[18px] border border-[#E1E7EF] bg-white p-3 shadow-[0_22px_60px_rgba(18,58,99,.16)]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un pays ou indicatif..."
            className="h-11 w-full rounded-[13px] border border-[#E1E7EF] bg-[#F8FAFC] px-3 text-sm font-bold outline-none focus:border-[#F15A24]"
          />

          <div className="mt-3 max-h-[250px] overflow-auto">
            {filtered.map((country) => (
              <button
                key={`${country.iso}-${country.dial}`}
                type="button"
                onClick={() => {
                  onChange(country);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-sm font-black text-[#123A63] hover:bg-[#F8FAFC]"
              >
                <span className="truncate">
                  {flagFromIso(country.iso)} {countryDisplayName(country, lang)}
                </span>
                {compact ? <span className="ml-3 text-slate-400">{country.dial}</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentCardElement({
  billingName,
  billingEmail,
  amount,
  caseNumber,
}: {
  billingName: string;
  billingEmail: string;
  amount: number;
  caseNumber: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(billingName || "");
  const [emailValue, setEmailValue] = useState(billingEmail || "");

  useEffect(() => {
    setName(billingName || "");
  }, [billingName]);

  useEffect(() => {
    setEmailValue(billingEmail || "");
  }, [billingEmail]);

  async function pay() {
    if (!stripe || !elements) {
      setError("Stripe n’est pas encore prêt.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Montant invalide. Merci de selectedr une package avant le payment.");
      return;
    }

    const card = elements.getElement(CardElement);

    if (!card) {
      setError("Le champ card est introuvable.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const intentRes = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount,
          currency: "USD",
          email: emailValue,
          case_number: caseNumber,
          billing_name: name
        })
      });

      const intent = await intentRes.json().catch(() => null);

      if (!intentRes.ok || intent?.ok === false || !intent?.clientSecret) {
        setError(intent?.error || "Impossible de préparer le payment Stripe.");
        return;
      }

      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name,
            email: emailValue
          }
        }
      });

      if (result.error) {
        setError(result.error.message || "Payment refusé.");
        return;
      }

      window.location.href = `/en/payment-success?email=${encodeURIComponent(emailValue)}`;
    } catch (e: any) {
      setError(e?.message || "Erreur payment Stripe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-[#E6EDF5] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
            Card payment
          </p>
          <h3 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-[#0F172A]">
            Secure payment
          </h3>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-7 text-slate-500">
            Enter your billing information and card details directly on this page.
          </p>
        </div>

        <div className="rounded-[18px] border border-[#E6EDF5] bg-white px-4 py-3 text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Montant
          </p>
          <p className="mt-1 text-[32px] font-black tracking-[-0.06em] text-[#F15A24]">
            ${amount}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Last name de billing
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Last name ou société"
            className="h-[56px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none transition focus:border-[#F15A24]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Email de billing
          </span>
          <input
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder="billing@domaine.com"
            className="h-[56px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none transition focus:border-[#F15A24]"
          />
        </label>
      </div>

      <div className="mt-5 rounded-[22px] border border-[#E6EDF5] bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#E6EDF5] bg-white text-xl">
            💳
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              Informations card
            </p>
            <p className="text-sm font-bold text-[#123A63]">
              Visa, Mastercard, American Express...
            </p>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#E6EDF5] bg-white px-4 py-5">
          <CardElement
            options={{
              hidePostalCode: true,
              disableLink: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#123A63",
                  fontWeight: "600",
                  fontFamily: "Inter, system-ui, sans-serif",
                  "::placeholder": {
                    color: "#94A3B8"
                  }
                },
                invalid: {
                  color: "#DC2626"
                }
              }
            }}
          />
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={pay}
        disabled={busy || !stripe || !elements || !amount}
        className="mt-6 h-[58px] w-full rounded-[18px] bg-[#F15A24] text-sm font-black text-white transition hover:bg-[#DB4F1C] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Traitement du payment..." : `Pay $${amount}`}
      </button>
    </div>
  );
}

export default function VemoStartFlowPage({ lang = "fr" }: { lang?: Lang }) {
  // VEMO_PUBLIC_PACKS_RUNTIME_SYNC
  const [publicPacks, setPublicPacks] = useState<any[]>([]);
  const [publicRegisteredAgentRenewal, setPublicRegisteredAgentRenewal] = useState<Record<string, number>>({
    "New Mexico": 35,
    Wyoming: 25,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/public/llc-packs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.ok) return;

        if (Array.isArray(data.packs)) {
          setPublicPacks(data.packs);
        }

        if (data.registeredAgentRenewal) {
          setPublicRegisteredAgentRenewal({
            "New Mexico": Number(data.registeredAgentRenewal["New Mexico"] || 35),
            Wyoming: Number(data.registeredAgentRenewal.Wyoming || 25),
          });
        }
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, []);

  const syncedPlans = useMemo(() => {
    const source = publicPacks.length ? publicPacks : VEMO_LLC_PACKS;

    return source.map((pack: any) => ({
      id: pack.id,
      label: pack.label,
      description: pack.description || "",
      recommended: Boolean(pack.recommended),
      prices: pack.prices || {},
      features: Array.isArray(pack.features) ? pack.features : [],
    }));
  }, [publicPacks]);

  function syncedPlanPrice(planId: any, selectedState: any) {
    return Number(
      syncedPlans.find((plan: any) => plan.id === planId)?.prices?.[selectedState] || 0
    );
  }

  function syncedPlanFeatures(planId: any, selectedState: any) {
    const plan = syncedPlans.find((item: any) => item.id === planId);
    if (!plan) return [];

    const renewalPrice = Number(
      publicRegisteredAgentRenewal?.[selectedState] ||
      (selectedState === "Wyoming" ? 25 : 35)
    );

    return (Array.isArray(plan.features) ? plan.features : [])
      .filter(Boolean)
      .map((feature: string) => {
        const clean = String(feature)
          .replace(/\s*\(Renouvellement\s+\d+\s*USD\s*\/\s*an\)\s*/i, "")
          .trim();

        if (clean.toLowerCase().includes("registered agent offert")) {
          return `${clean} (Renouvellement ${renewalPrice} USD / an)`;
        }

        return clean;
      });
  }

  // RUNTIME_EDITABLE_PACKS_PATCH
  const [runtimePacks, setRuntimePacks] = useState<any[]>([]);
  const [runtimeRenewal, setRuntimeRenewal] = useState<Record<string, number>>({
    Wyoming: 25,
    "New Mexico": 35,
  });

  useEffect(() => {
    let alive = true;

    fetch("/api/public/llc-packs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!alive || !data?.ok) return;

        if (Array.isArray(data.packs)) {
          setRuntimePacks(data.packs);
        }

        if (data.registeredAgentRenewal) {
          setRuntimeRenewal(data.registeredAgentRenewal);
        }
      })
      .catch(() => null);

    return () => {
      alive = false;
    };
  }, []);

  const runtimePlans = useMemo(() => {
    const source = runtimePacks.length ? runtimePacks : VEMO_LLC_PACKS;

    return source.map((pack: any) => ({
      id: pack.id,
      label: pack.label,
      description: pack.description || "",
      recommended: Boolean(pack.recommended),
      prices: pack.prices || {
        Wyoming: 0,
        "New Mexico": 0,
      },
      features: Array.isArray(pack.features) ? pack.features : [],
    }));
  }, [runtimePacks]);

  function getRuntimePlanPrice(planId: any, selectedState: any) {
    return (
      runtimePlans.find((plan: any) => plan.id === planId)?.prices?.[selectedState] || 0
    );
  }

  function getRuntimePlanFeatures(planId: any, selectedState: any) {
    const plan = runtimePlans.find((item: any) => item.id === planId);
    if (!plan) return [];

    const renewalPrice = runtimeRenewal?.[selectedState] || 0;

    return [
      ...(Array.isArray(plan.features) ? plan.features : []),
      renewalPrice
        ? `Renouvellement Registered Agent : ${renewalPrice} USD / an`
        : "Renouvellement Registered Agent",
    ];
  }

  const t = content[lang];

  const [step, setStep] = useState(0);
  const [planId, setPlanId] = useState<PlanId>("");
  const [state, setState] = useState("New Mexico");
  const [packId, setPackId] = useState("");

  const [llcName, setLlcName] = useState("");
  const [designator, setDesignator] = useState("LLC");
  const [alternativeName, setAlternativeName] = useState("");

  const [activitySector, setActivitySector] = useState(activitySectors[0]);
  const [activityDescription, setActivityDescription] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [countryIso, setCountryIso] = useState("MA");
  const [phoneCountryIso, setPhoneCountryIso] = useState("MA");
  const [phone, setPhone] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberCountryIso, setMemberCountryIso] = useState("MA");
  const [memberRole, setMemberRole] = useState("Member et Manager");
  const [managerName, setManagerName] = useState("");

  const [address, setAddress] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressCountryIso, setAddressCountryIso] = useState("MA");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [confirmSummary, setConfirmSummary] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [caseNumber, setDossierNumber] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [autoStripeAttempted, setAutoStripeAttempted] = useState(false);
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedPlan = useMemo(() => runtimePlans.find((p) => p.id === planId) || null, [planId]);

  const safeSelectedPlan =
    selectedPlan ||
    syncedPlans?.[0] ||
    publicPacks?.[0] ||
    {
      id: "starter",
      label: "Starter",
      description: "",
      prices: {
        "New Mexico": 129,
        Wyoming: 179,
      },
      features: [],
    };

  const selectedCountry = useMemo(() => VEMO_COUNTRIES.find((c) => c.iso === countryIso) || VEMO_COUNTRIES.find((c) => c.iso === "MA")!, [countryIso]);
  const phoneCountry = useMemo(() => VEMO_COUNTRIES.find((c) => c.iso === phoneCountryIso) || VEMO_COUNTRIES.find((c) => c.iso === "MA")!, [phoneCountryIso]);
  const memberCountry = useMemo(() => VEMO_COUNTRIES.find((c) => c.iso === memberCountryIso) || selectedCountry, [memberCountryIso, selectedCountry]);
  const addressCountry = useMemo(() => VEMO_COUNTRIES.find((c) => c.iso === addressCountryIso) || selectedCountry, [addressCountryIso, selectedCountry]);

  const services = selectedPlan ? getRuntimePlanFeatures(safeSelectedPlan.id, state) : [];
  const selectableServices = visibleSelectableServices(services);
  const finalPrice = selectedPlan ? getRuntimePlanPrice(safeSelectedPlan.id, state) : null;
  const packName = selectedPlan ? `${state} ${selectedPlan?.label || "To choose"}` : "";
  const progress = Math.round(((step + 1) / t.steps.length) * 100);
  const switchHref = lang === "fr" ? "/en/commencer" : "/fr/commencer";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qPack = params.get("pack");
    const qState = params.get("state");
    const qEmail = params.get("email");
    const qName = params.get("name");
    const qLlc = params.get("llc");

    if (qPack) {
      setPlanId(slugPlanToPlan(qPack));
      setPackId(qPack);
    }

    if (qState?.toLowerCase().includes("wyoming")) setState("Wyoming");
    if (qState?.toLowerCase().includes("new")) setState("New Mexico");

    if (qEmail) setEmail(qEmail);
    if (qName) {
      setFullName(qName);
      setMemberName(qName);
      setManagerName(qName);
    }
    if (qLlc) setLlcName(qLlc);
  }, []);

  useEffect(() => {
    if (!memberName && fullName) setMemberName(fullName);
    if (!managerName && fullName) setManagerName(fullName);
  }, [fullName, memberName, managerName]);

  useEffect(() => {
    setMemberCountryIso(countryIso);
    setAddressCountryIso(countryIso);
  }, [countryIso]);

  useEffect(() => {
    setSelectedServices([]);
  }, [planId, state]);

  useEffect(() => {
    // CLEAN_SELECTED_SERVICES_HIDDEN_ITEMS
    setSelectedServices((prev) =>
      prev.filter((service) => visibleSelectableServices([service]).length > 0)
    );
  }, [services.join("|")]);

  useEffect(() => {
    if (memberRole === "Member et Manager") {
      setManagerName(memberName);
    }
  }, [memberRole, memberName]);
  useEffect(() => {
    // AUTO_REDIRECT_PAYMENT_WITHOUT_PLAN
    if (step === 9 && (!selectedPlan || !finalPrice)) {
      setStep(1);
    }
  }, [step, selectedPlan, finalPrice]);

  function handlePhoneChange(value: string) {
    const country = findCountryByDial(value);

    if (country) {
      setPhoneCountryIso(country.iso);
      setPhone(value.replace(country.dial, "").replace(/^\s+/, ""));
      return;
    }

    setPhone(value);
  }

  function toggleService(service: string) {
    setSelectedServices((prev) => {
      if (prev.includes(service)) return prev.filter((item) => item !== service);
      return [...prev, service];
    });
  }

  function canContinue() {
    if (step === 1 && !selectedPlan) return false;
    if (step === 2 && !llcName.trim()) return false;
    if (step === 3 && (!activitySector.trim() || !activityDescription.trim())) return false;
    if (step === 4 && (!fullName.trim() || !emailIsValid(email) || !phoneIsValid(phone))) return false;
    if (step === 5 && (!memberName.trim() || !memberRole.trim())) return false;
    if (step === 5 && memberRole === "Member" && !managerName.trim()) return false;
    if (step === 6 && (!address.trim() || !addressCity.trim() || !addressCountryIso.trim())) return false;
    if (step === 7 && selectableServices.length > 0 && selectedServices.length === 0) return false;
    if (step === 8 && !confirmSummary) return false;
    return true;
  }

  async function createOrder(method: PaymentMethod) {
    if (!selectedPlan || !finalPrice) {
      throw new Error("Merci de selectedr une package.");
    }

    const manager = memberRole === "Member" ? managerName : memberName;

    const res = await fetch("/api/orders/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang,
        full_name: fullName,
        email,
        phone: `${phoneCountry.dial} ${phone}`.trim(),
        phone_country: countryDisplayName(phoneCountry, lang),
        country: countryDisplayName(selectedCountry, lang),
        llc_name: `${llcName} ${designator}`.trim(),
        llc_name_raw: llcName,
        llc_designator: designator,
        llc_alternative_name: alternativeName,
        state,
        package_name: packName,
        pack_id: packId || `${state.toLowerCase().replace(/\s+/g, "_")}_${safeSelectedPlan.id}`,
        amount: finalPrice,
        currency: "USD",
        payment_method: method,
        activity_sector: activitySector,
        activity_description: activityDescription,
        member_name: memberName,
        member_country: countryDisplayName(memberCountry, lang),
        member_role: memberRole,
        manager_name: manager,
        address,
        address_city: addressCity,
        address_postal_code: addressPostalCode,
        address_country: countryDisplayName(addressCountry, lang),
        services: selectedServices,
        summary_confirmed: confirmSummary,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || "Erreur formation case.");
    }

    setDossierNumber(data?.case_number || "");
    return data;
  }

  async function prepareStripePayment() {
    setError("");
    setBusy(true);

    try {
      const order = caseNumber ? { case_number: caseNumber } : await createOrder("card");

      const intentRes = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalPrice,
          currency: "USD",
          email,
          case_number: order.case_number || caseNumber,
        }),
      });

      const intent = await intentRes.json().catch(() => null);

      if (!intentRes.ok || intent?.ok === false || !intent?.clientSecret) {
        setError(intent?.error || "Impossible de préparer le payment Stripe.");
        return;
      }

      setClientSecret(intent.clientSecret);
    } catch (e: any) {
      setError(e?.message || "Erreur préparation payment.");
    } finally {
      setBusy(false);
    }
  }

  async function submitBankTransfer() {
    setError("");

    if (!bankProofFile) {
      setError("Merci d’uploader le payment proof de transfer.");
      return;
    }

    setBusy(true);

    try {
      const order = caseNumber ? { case_number: caseNumber } : await createOrder("bank_transfer");

      const form = new FormData();
      form.append("email", email);
      form.append("case_number", order.case_number || caseNumber);
      form.append("file", bankProofFile);

      const res = await fetch("/api/orders/bank-transfer-proof", {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        setError(data?.error || "Erreur upload payment proof.");
        return;
      }

      window.location.href = `/en/payment-pending-verification?email=${encodeURIComponent(email)}`;
    } catch (e: any) {
      setError(e?.message || "Erreur transfer.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setError("");

    if (!canContinue()) {
      if (step === 4) setError("Merci de vérifier le nom complet, l’email et le numéro de phone.");
      else if (step === 7) setError("Merci de select au moins un service inclus.");
      else if (step === 8) setError("Merci de confirmer les informations avant le payment.");
      else setError("Please complete this step before continuing.");
      return;
    }

    if (step < 9) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function back() {
    if (step === 0) return;
    setError("");
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F8FB] text-[#111827]">
      <header className="border-b border-[#E3EAF2] bg-white">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
          <a href={lang === "fr" ? "/fr" : "/en"} className="group inline-flex flex-col">
            <div className="text-[28px] font-black uppercase leading-none tracking-[-0.06em]">
              <span className="text-[#123A63]">VEMO</span>
              <span className="text-[#F15A24]">TECH</span>
            </div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
              US LLC POUR NON-RÉSIDENTS
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-black text-[#111827] lg:flex">
            <a href={lang === "fr" ? "/fr" : "/en"}>{t.home}</a>
            <a href={lang === "fr" ? "/fr/tarifs" : "/en/pricing"}>{t.pricing}</a>
            <a href="/fr/faq">{t.faq}</a>
            <a href="/en/contact">{t.contact}</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={switchHref}
              className="rounded-full border border-[#E3EAF2] bg-white px-4 py-2 text-xs font-black text-[#111827] transition hover:text-[#F15A24]"
            >
              {lang === "fr" ? "EN" : "FR"}
            </a>

            <a
              href={lang === "fr" ? "/fr/tarifs" : "/en/pricing"}
              className="rounded-[14px] bg-[#F15A24] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(18,58,99,.12)] hover:bg-[#D94A1B]"
            >
              {t.start} →
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[1.6rem] border border-[#E3EAF2] bg-white p-3 shadow-[0_18px_45px_rgba(18,58,99,0.06)]">
          <div className="grid gap-2 md:grid-cols-5 lg:grid-cols-10">
            {t.steps.map((label, index) => (
              <button
                key={translateEnServiceLabel(String(label))}
                type="button"
                onClick={() => setStep(index)}
                className={`min-h-[76px] rounded-[14px] border p-3 text-left transition ${
                  step === index
                    ? "border-[#F15A24] bg-white text-[#F15A24]"
                    : index < step
                    ? "border-[#DCE7F2] bg-[#F8FAFC] text-[#123A63]"
                    : "border-[#E3EAF2] bg-white text-slate-400"
                }`}
              >
                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                  step === index ? "bg-[#F15A24] text-white" : "bg-[#EDF3F8] text-[#123A63]"
                }`}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="text-[11px] font-black">{translateEnServiceLabel(String(label))}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1.1fr_0.68fr]">
          <section className="rounded-[2rem] border border-[#E3EAF2] bg-white p-8 shadow-[0_24px_70px_rgba(18,58,99,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
              Step {String(step + 1).padStart(2, "0")}
            </p>

            {step === 0 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">Choose the formation state</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  Choose the state before selecting a package, because pricing and timelines may vary.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {["New Mexico", "Wyoming"].map((s) => {
                    const selected = state === s;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setState(s)}
                        className={`relative min-h-[220px] rounded-[1.8rem] border bg-white p-6 text-left transition ${
                          selected
                            ? "border-[#F15A24] shadow-[0_20px_48px_rgba(18,58,99,.10)]"
                            : "border-[#E3EAF2] shadow-[0_12px_28px_rgba(18,58,99,.04)] hover:border-[#F15A24]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                              Formation state
                            </p>
                            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#123A63]">
                              {s}
                            </h3>
                          </div>

                          <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                            selected ? "border-[#F15A24] bg-[#F15A24] text-white" : "border-[#D6E0EA] bg-white text-transparent"
                          }`}>
                            ✓
                          </div>
                        </div>

                        <p className="mt-4 text-sm font-bold leading-7 text-slate-500">
                          {s === "New Mexico"
                            ? "Privacy, optimized cost, and a simple structure for non-resident entrepreneurs."
                            : "Recognized state, stronger corporate image, and generally faster processing."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">
                  Choose your package
                </h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  The displayed pricing is based on the selected state: {state}.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {runtimePlans.map((plan) => {
                    const preview = FORMULA_PREVIEW[plan.id];
                    const selected = planId === plan.id;

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setPlanId(plan.id)}
                        className={`flex min-h-[350px] flex-col rounded-[1.45rem] border bg-white p-5 text-left transition ${
                          selected
                            ? "border-[#F15A24] shadow-none"
                            : "border-[#DCE7F3] hover:border-[#F15A24]/45"
                        }`}
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="min-h-[30px]">
                            {plan.recommended ? (
                              <span className="inline-flex h-[30px] items-center rounded-full border border-[#F15A24] bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#F15A24]">
                                Recommandé
                              </span>
                            ) : null}
                          </div>

                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                              selected
                                ? "border-[#F15A24] bg-[#F15A24] text-white"
                                : "border-[#B7C9DD] bg-white text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </div>

                        <h3 className="text-[20px] font-black tracking-[-0.04em] text-[#123A63]">
                          {plan.label}
                        </h3>

                        <div className="mt-2 text-[36px] font-black leading-none tracking-[-0.06em] text-[#123A63]">
                          ${getRuntimePlanPrice(plan.id, state)}
                        </div>

                        <p className="mt-4 min-h-[76px] text-[14px] font-bold leading-6 text-slate-500">
                          {preview.subtitle}
                        </p>

                        <div className="mt-5 space-y-3">
                          {preview.bullets.map((item) => (
                            <div key={translateEnServiceLabel(String(item))} className="flex items-start gap-2">
                              <span className="mt-[2px] text-[13px] font-black text-[#F15A24]">
                                ✓
                              </span>
                              <span className="text-[14px] font-black leading-5 text-[#123A63]">
                                {translateEnServiceLabel(String(item))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">Desired LLC name</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  Enter your desired name, the designator, and an alternative name in case the first choice is unavailable.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px]">
                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Desired name</span>
                    <input value={llcName} onChange={(e) => setLlcName(e.target.value)} className={inputClass()} placeholder="Ex : Vemo Technology" />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Designator</span>
                    <select value={designator} onChange={(e) => setDesignator(e.target.value)} className={inputClass()}>
                      {designators.map((item) => <option key={translateEnServiceLabel(String(item))} value={translateEnServiceLabel(String(item))}>{translateEnServiceLabel(String(item))}</option>)}
                    </select>
                  </label>

                  <label className="md:col-span-2">
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Alternative name</span>
                    <input value={alternativeName} onChange={(e) => setAlternativeName(e.target.value)} className={inputClass()} placeholder="Ex : Vemo Global LLC" />
                  </label>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">Business activity</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  Choose the sector and clearly describe the planned business activity.
                </p>

                <div className="mt-6 grid gap-4">
                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Sector d’activity</span>
                    <select value={activitySector} onChange={(e) => setActivitySector(e.target.value)} className={inputClass()}>
                      {activitySectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Business activity description</span>
                    <textarea value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} className={textareaClass()} placeholder="Ex : online consulting, digital services, software, e-commerce..." />
                  </label>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">Account information</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  Email and phone must be valid. Morocco is selected by default.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Full last name</span>
                    <input
                      value={fullName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFullName(value);
                        setMemberName(value);
                        if (memberRole !== "Member") setManagerName(value);
                      }}
                      className={inputClass()}
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass()} ${email && !emailIsValid(email) ? "border-red-300" : ""}`} />
                    {email && !emailIsValid(email) ? <p className="mt-2 text-xs font-black text-red-600">Email invalide.</p> : null}
                  </label>

                  <CountryPicker label="Country of residence" valueIso={countryIso} onChange={(country) => setCountryIso(country.iso)} lang={lang} />

                  <div>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Phone / WhatsApp</span>
                    <div className="grid grid-cols-[118px_1fr] gap-3">
                      <CountryPicker label="" valueIso={phoneCountryIso} onChange={(country) => setPhoneCountryIso(country.iso)} compact lang={lang} />
                      <input value={phone} onChange={(e) => handlePhoneChange(e.target.value)} className={`${inputClass()} ${phone && !phoneIsValid(phone) ? "border-red-300" : ""}`} placeholder="651980076" />
                    </div>
                    {phone && !phoneIsValid(phone) ? <p className="mt-2 text-xs font-black text-red-600">Numéro invalide.</p> : null}
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">Main member</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  Enter the owner or main member information. The client name is suggested automatically.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_220px]">
                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Member last name</span>
                    <input value={memberName} onChange={(e) => setMemberName(e.target.value)} className={inputClass()} placeholder="Full last name" />
                  </label>

                  <CountryPicker label="Country" valueIso={memberCountryIso} onChange={(country) => setMemberCountryIso(country.iso)} lang={lang} />

                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Role</span>
                    <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className={inputClass()}>
                      <option value="Member">Member</option>
                      <option value="Manager">Manager</option>
                      <option value="Member et Manager">Member et Manager</option>
                    </select>
                  </label>

                  {memberRole === "Member" ? (
                    <label className="md:col-span-3">
                      <span className="mb-2 block text-sm font-black text-[#123A63]">Manager</span>
                      <input value={managerName} onChange={(e) => setManagerName(e.target.value)} className={inputClass()} placeholder="Last name du manager" />
                    </label>
                  ) : null}
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">Client address</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  Address used for the case and billing. The country is suggested from the owner information.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <label className="md:col-span-3">
                    <span className="mb-2 block text-sm font-black text-[#123A63]">Address</span>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass()} placeholder="Full address" />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">City</span>
                    <input value={addressCity} onChange={(e) => setAddressCity(e.target.value)} className={inputClass()} />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-[#123A63]">ZIP code</span>
                    <input value={addressPostalCode} onChange={(e) => setAddressPostalCode(e.target.value)} className={inputClass()} />
                  </label>

                  <CountryPicker label="Country" valueIso={addressCountryIso} onChange={(country) => setAddressCountryIso(country.iso)} lang={lang} />
                </div>
              </>
            )}

            {step === 7 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">Included services</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  Select the services to activate in your package: {selectedPlan?.label || "—"}.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {selectableServices.length === 0 ? (
                    <div className="md:col-span-2 rounded-[1.3rem] border border-[#E3EAF2] bg-[#F8FAFC] p-5 text-sm font-black text-slate-500">
                      No additional service to select for this package.
                    </div>
                  ) : selectableServices.map((service) => (
                    <button
                      key={translateEnServiceLabel(String(service))}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`flex min-h-[70px] items-center gap-3 rounded-[1.3rem] border bg-white p-4 text-left text-sm font-black text-[#123A63] transition ${
                        selectedServices.includes(service)
                          ? "border-[#E3EAF2] shadow-[0_12px_28px_rgba(18,58,99,.06)]"
                          : "border-[#E3EAF2] hover:border-[#F15A24]/40"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                          selectedServices.includes(service)
                            ? "border-[#F15A24] bg-white text-[#F15A24]"
                            : "border-[#D6E0EA] bg-[#F8FAFC] text-slate-400"
                        }`}
                      >
                        {selectedServices.includes(service) ? "✓" : "+"}
                      </span>
                      <span>{translateEnServiceLabel(String(service))}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 8 && (
              <>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">Pre-payment summary</h1>
                <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                  Review the information before continuing to secure payment.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    ["State", state],
                    ["Package", selectedPlan?.label || "—"],
                    ["LLC name", `${llcName} ${designator}`.trim()],
                    ["Alternative name", alternativeName],
                    ["Sector", activitySector],
                    ["Activity", activityDescription],
                    ["Client", fullName],
                    ["Email", email],
                    ["Client country", countryDisplayName(selectedCountry, lang)],
                    ["Phone", `${phoneCountry.dial} ${phone}`],
                    ["Main member", memberName],
                    ["Country du membre", countryDisplayName(memberCountry, lang)],
                    ["Role", memberRole],
                    ["Manager", memberRole === "Member" ? managerName : memberName],
                    ["Address", address],
                    ["City", addressCity],
                    ["ZIP code", addressPostalCode],
                    ["Country adresse", countryDisplayName(addressCountry, lang)],
                    ["Selected services", selectedServices.length ? selectedServices.join(", ") : "—"],
                  ].map(([key, value]) => (
                    <div key={key} className="rounded-[1.2rem] border border-[#E3EAF2] bg-[#F8FAFC] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{key}</p>
                      <p className="mt-2 text-sm font-black text-[#123A63]">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                <label className="mt-6 flex gap-4 rounded-[1.5rem] border border-[#E3EAF2] bg-white p-5 text-sm font-black leading-7 text-[#123A63]">
                  <input
                    type="checkbox"
                    checked={confirmSummary}
                    onChange={(e) => setConfirmSummary(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#F15A24]"
                  />
                  <span>
                    I confirm that the information provided is correct and I agree to continue to secure payment.
                  </span>
                </label>
              </>
            )}

            {step === 9 && (
              <>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
                      Step 10
                    </p>
                    <h1 className="mt-2 text-[42px] font-black tracking-[-0.06em] text-[#0F172A]">
                      Secure payment
                    </h1>
                    <p className="mt-4 max-w-2xl text-[15px] font-semibold leading-8 text-slate-500">
                      Complete your case en selecting votre mode de payment.
                      La card payment est selected par défaut.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-[#E6EDF5] bg-white px-5 py-4 text-right shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Total
                    </p>
                    <p className="mt-1 text-[38px] font-black tracking-[-0.06em] text-[#F15A24]">
                      ${finalPrice || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-[32px] border border-[#E6EDF5] bg-white p-7 shadow-[0_20px_55px_rgba(15,23,42,0.05)]">
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Last name de billing
                      </span>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Last name ou société"
                        className="h-[56px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none transition focus:border-[#F15A24]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Email de billing
                      </span>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="billing@domaine.com"
                        className="h-[56px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none transition focus:border-[#F15A24]"
                      />
                    </label>
                  </div>

                  <div className="mt-6">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Méthode de payment
                    </span>

                    <select
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value as PaymentMethod);
                        setClientSecret("");
                      }}
                      className="h-[56px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-black text-[#123A63] outline-none transition focus:border-[#F15A24]"
                    >
                      <option value="card">Card payment</option>
                      <option value="bank_transfer">Bank transfer</option>
                    </select>
                  </div>

                  <div className="mt-6">
                    {paymentMethod === "card" ? (
                      !stripePromise ? (
                        <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-bold text-amber-800">
                          Stripe n’est pas configuré : ajoute NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY et STRIPE_SECRET_KEY dans .env.local.
                        </div>
                      ) : (
                        <Elements stripe={stripePromise}>
                          <PaymentCardElement
                            billingName={fullName}
                            billingEmail={email}
                            amount={finalPrice || 0}
                            caseNumber={caseNumber}
                          />
                        </Elements>
                      )
                    ) : (
                      <div className="rounded-[28px] border border-[#E6EDF5] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#F15A24]">
                              Bank transfer payment
                            </p>
                            <h3 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-[#0F172A]">
                              Upload payment proof
                            </h3>
                            <p className="mt-2 max-w-xl text-sm font-semibold leading-7 text-slate-500">
                              Contact VEMO on WhatsApp puis ajoutez le payment proof.
                              Your case will then move to pending verification.
                            </p>
                          </div>

                          <a
                            href="https://wa.me/"
                            target="_self"
                            rel="noreferrer"
                            className="inline-flex h-[52px] min-w-[170px] items-center justify-center rounded-[16px] border border-[#F15A24] bg-[#F15A24] px-5 text-sm font-black text-white transition hover:bg-[#DB4F1C]"
                          >
                            WhatsApp
                          </a>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-[18px] border border-[#E6EDF5] bg-white p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Step 01
                            </p>
                            <p className="mt-2 text-sm font-black text-[#123A63]">
                              Contact VEMO
                            </p>
                          </div>

                          <div className="rounded-[18px] border border-[#E6EDF5] bg-white p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Step 02
                            </p>
                            <p className="mt-2 text-sm font-black text-[#123A63]">
                              Upload payment proof
                            </p>
                          </div>

                          <div className="rounded-[18px] border border-[#E6EDF5] bg-white p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Step 03
                            </p>
                            <p className="mt-2 text-sm font-black text-[#123A63]">
                              Admin verification
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <input
                            type="file"
                            onChange={(e) => setBankProofFile(e.target.files?.[0] || null)}
                            className="block w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 py-4 text-sm font-bold text-[#123A63]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={submitBankTransfer}
                          disabled={busy}
                          className="mt-5 h-[58px] w-full rounded-[18px] bg-[#F15A24] text-sm font-black text-white transition hover:bg-[#DB4F1C] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? "Upload payment proof..." : "Upload payment proof et continuer →"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {error ? (
              <div className="mt-6 rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-8 flex items-center justify-between border-t border-[#E3EAF2] pt-6">
              <button
                type="button"
                onClick={back}
                className="rounded-[12px] border border-[#E3EAF2] bg-[#F8FAFC] px-6 py-3 text-sm font-black text-[#123A63] disabled:opacity-40"
              >
                {t.back}
              </button>

              {step < 9 ? (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-[12px] bg-[#F15A24] px-8 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(18,58,99,.12)] hover:bg-[#D94A1B]"
                >
                  {t.next} →
                </button>
              ) : null}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-[#E3EAF2] bg-white p-8 shadow-[0_24px_70px_rgba(18,58,99,0.08)]">
            <h2 className="text-3xl font-black tracking-[-0.06em]">{t.summary}</h2>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              {t.company}
            </p>

            <div className="mt-5 h-2 rounded-full bg-[#EDF3F8]">
              <div className="h-2 rounded-full bg-[#F15A24]" style={{ width: `${progress}%` }} />
            </div>

            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#123A63]">
              {t.progress} : {progress}%
            </p>

            <div className="mt-8 space-y-5">
              {[
                ["State", state, "Included"],
                ["Service package", selectedPlan?.label || "To choose", selectedPlan ? `$${finalPrice}` : "—"],
                ["Services", selectableServices.length ? (selectedServices.length ? `${selectedServices.length} selected(s)` : "To select") : "Included in the package", "$0"],
              ].map(([key, value, price]) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[#111827]">{key}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{translateEnServiceList(value)}</p>
                  </div>
                  <p className="text-sm font-black text-[#111827]">{price}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.4rem] border border-[#F15A24] bg-white p-5">
              <div className="flex items-end justify-between gap-4">
                <p className="text-lg font-black text-[#111827]">{t.estimated}</p>
                {selectedPlan ? (
                  <p className="text-4xl font-black tracking-[-0.08em] text-[#F15A24]">${finalPrice}</p>
                ) : (
                  <p className="text-sm font-black text-slate-400">After package selection</p>
                )}
              </div>
            </div>

            <p className="mt-5 text-xs font-bold leading-6 text-slate-500">
              {t.finalNote}
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
