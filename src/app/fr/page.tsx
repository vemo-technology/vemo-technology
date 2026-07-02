import VemoPublicHeader from "@/components/site/VemoPublicHeader";
import Link from "next/link";

const services = [
  {
    icon: "M7 6h10M7 10h10M7 14h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    title: "Création LLC",
    text: "Création de société LLC aux États-Unis pour entrepreneurs non-résidents.",
    href: "/fr/commencer",
  },
  {
    icon: "M8 7h8M8 11h8M8 15h5M6 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z",
    title: "EIN application",
    text: "Service EIN seul à 29 USD ou inclus selon le pack choisi.",
    href: "/fr/ein",
  },
  {
    icon: "M4 10h16M6 10V8l6-4 6 4v2M7 10v8M12 10v8M17 10v8M5 18h14",
    title: "US LLC for non-residents",
    text: "Assistance Stripe, Mercury, Wise, Payoneer, PayPal et Shopify.",
    href: "/fr/banking-guidance",
  },
  {
    icon: "M5 5h14v10H5V5Zm3 14h8M9 9h6M9 12h4",
    title: "Espace client",
    text: "Documents, messages, statuts et suivi dossier centralisés.",
    href: "/fr/commencer",
  },
];

const states = [
  {
    name: "New Mexico",
    price: "129 USD",
    renewal: "35 USD/an",
    text: "Option simple, discrète et économique pour beaucoup d’entrepreneurs non-résidents.",
    points: ["Coût de départ réduit", "Structure simple", "Adapté aux activités digitales"],
  },
  {
    name: "Wyoming",
    price: "179 USD",
    renewal: "25 USD/an",
    text: "Option business-friendly, appréciée pour son image corporate et sa confidentialité.",
    points: ["Image plus corporate", "Confidentialité appréciée", "Renouvellement RA plus bas"],
  },
];

const steps = [
  ["01", "Choisir la formule", "Starter, Standard ou Premium selon votre besoin."],
  ["02", "Remplir le formulaire", "Ajoutez vos informations, l’État choisi et les détails d’activité."],
  ["03", "Payer ou envoyer le justificatif", "Stripe ou virement avec justificatif depuis la plateforme."],
  ["04", "Suivre le dossier", "Documents, messages et statuts dans votre espace client."],
];

const packGroups = [
  {
    state: "New Mexico",
    packs: [
      {
        name: "Starter",
        price: "129$",
        text: "Création LLC simple avec documents essentiels.",
        features: ["Création LLC", "Frais de dépôt inclus", "Registered Agent 1 an", "US Phone Number 3 mois"],
      },
      {
        name: "Standard",
        price: "149$",
        text: "LLC + EIN + assistance bancaire.",
        features: ["Tout Starter", "EIN application", "Assistance Stripe", "Assistance Mercury"],
        recommended: true,
      },
      {
        name: "Premium",
        price: "199$",
        text: "Accompagnement complet au lancement.",
        features: ["Tout Standard", "PayPal", "Wise / Payoneer", "Shopify 3 mois + domaine"],
      },
    ],
  },
  {
    state: "Wyoming",
    packs: [
      {
        name: "Starter",
        price: "179$",
        text: "Création LLC Wyoming avec documents essentiels.",
        features: ["Création LLC", "Frais de dépôt inclus", "Registered Agent 1 an", "US Phone Number 3 mois"],
      },
      {
        name: "Standard",
        price: "199$",
        text: "LLC Wyoming + EIN + assistance bancaire.",
        features: ["Tout Starter", "EIN application", "Assistance Stripe", "Assistance Mercury"],
        recommended: true,
      },
      {
        name: "Premium",
        price: "249$",
        text: "Pack Wyoming complet pour lancement premium.",
        features: ["Tout Standard", "PayPal", "Wise / Payoneer", "Shopify 3 mois + domaine"],
      },
    ],
  },
];

function Icon({ path }: { path: string }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#E6EDF5] bg-white text-[#F15A24]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d={path} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Check() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E6EDF5] bg-white text-xs font-black text-[#F15A24]">
      ✓
    </span>
  );
}

function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/212600000000"
      target="_self"
      rel="noopener noreferrer"
      aria-label="Contacter VEMO sur WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#F15A24] text-white transition hover:bg-[#DB4F1C]"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M16.02 4C9.4 4 4.02 9.36 4.02 15.95c0 2.1.55 4.15 1.6 5.96L4 28l6.25-1.58a12.05 12.05 0 0 0 5.77 1.47c6.62 0 12-5.36 12-11.94C28.02 9.36 22.64 4 16.02 4Zm0 21.86c-1.78 0-3.52-.48-5.04-1.4l-.36-.21-3.7.94.98-3.6-.24-.37a9.84 9.84 0 0 1-1.51-5.27c0-5.47 4.43-9.92 9.87-9.92s9.87 4.45 9.87 9.92-4.43 9.91-9.87 9.91Zm5.42-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.29-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.04-.17-.29-.02-.45.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.48.71.3 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}

export default function FrenchHomePage() {
  return (
    <>
      <VemoPublicHeader locale="fr" />
      <VemoPublicHeader locale="fr" />
<main className="vemo-public-zero-reflets min-h-screen bg-white text-[#111827]">
<section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-[12px] border border-[#E6EDF5] bg-white px-4 py-2 text-sm font-black text-[#123A63]">
            <span className="text-[#F15A24]">15k+</span>
            <span>entrepreneurs accompagnés</span>
          </div>

          <h1 className="mt-8 max-w-3xl text-[42px] font-black leading-[1.05] tracking-[-0.055em] text-[#111827] md:text-[60px]">
            Créez votre <span className="text-[#F15A24]">LLC US</span>
            <br />
            simplement, depuis l’étranger
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-slate-500">
            VEMO Technology vous accompagne pour créer votre LLC aux États-Unis,
            demander votre EIN, préparer vos solutions bancaires et suivre votre dossier
            depuis un espace client simple et centralisé.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/fr/commencer" className="rounded-[16px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white transition hover:bg-[#DB4F1C]">
              Créer ma LLC
            </Link>
            <Link href="/fr/tarifs" className="rounded-[16px] border border-[#E6EDF5] bg-white px-6 py-4 text-sm font-black text-[#123A63] transition hover:border-[#F15A24] hover:text-[#F15A24]">
              Voir les tarifs
            </Link>
            <Link href="/fr/ein" className="rounded-[16px] border border-[#E6EDF5] bg-white px-6 py-4 text-sm font-black text-[#123A63] transition hover:border-[#F15A24] hover:text-[#F15A24]">
              EIN seul 29$
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-[#E6EDF5] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6EDF5] pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#F15A24]">
                VEMO LLC Setup
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#111827]">
                Votre dossier en 4 étapes
              </h2>
            </div>
            <span className="rounded-full bg-[#F15A24] px-3 py-1 text-xs font-black text-white">
              Online
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {[
              ["01", "Choix de l’État", "New Mexico ou Wyoming selon votre besoin."],
              ["02", "Création LLC", "Préparation du dossier et documents de création."],
              ["03", "EIN & Banking", "EIN application et assistance Stripe / Mercury / Wise."],
              ["04", "Espace client", "Documents, messages et statuts visibles en ligne."],
            ].map(([number, title, text]) => (
              <div key={number} className="grid gap-4 rounded-[20px] border border-[#E6EDF5] bg-white p-4 sm:grid-cols-[54px_1fr]">
                <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#F15A24] text-sm font-black text-white">
                  {number}
                </span>
                <div>
                  <h3 className="text-base font-black text-[#123A63]">{title}</h3>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E6EDF5] bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#F15A24]">
            Estimateur
          </p>
          <h2 className="mx-auto mt-4 max-w-5xl text-[34px] font-black leading-tight tracking-[-0.055em] md:text-[52px]">
            Calculez le coût de votre création <span className="text-[#F15A24]">LLC US</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base font-bold leading-7 text-slate-500">
            Choisissez l’État, la formule et les services adaptés à votre activité.
          </p>
          <div className="mt-7 flex justify-center">
            <Link href="/fr/commencer" className="rounded-[16px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white hover:bg-[#DB4F1C]">
              Obtenir mon coût
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#F15A24]">
            Services
          </p>
          <h2 className="text-[36px] font-black tracking-[-0.06em] md:text-[52px]">
            Services VEMO Technology
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base font-bold leading-7 text-slate-500">
            Des services opérationnels pour créer, suivre et organiser votre LLC.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Link key={service.title} href={service.href} className="rounded-[24px] border border-[#E6EDF5] bg-white p-6 transition hover:border-[#F15A24]">
              <Icon path={service.icon} />
              <h3 className="mt-8 text-xl font-black tracking-[-0.04em] text-[#123A63]">
                {service.title}
              </h3>
              <p className="mt-4 text-sm font-bold leading-7 text-slate-500">
                {service.text}
              </p>
              <p className="mt-5 text-sm font-black text-[#F15A24]">
                En savoir plus
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E6EDF5] bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#F15A24]">
              États proposés
            </p>
            <h2 className="text-[36px] font-black tracking-[-0.06em] md:text-[52px]">
              Choisissez le bon État pour votre LLC
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base font-bold leading-7 text-slate-500">
              New Mexico et Wyoming sont les deux États proposés dans VEMO pour démarrer simplement.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {states.map((state) => (
              <div key={state.name} className="rounded-[28px] border border-[#E6EDF5] bg-white p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-black tracking-[-0.05em] text-[#111827]">
                      {state.name}
                    </h3>
                    <p className="mt-2 text-sm font-black text-[#F15A24]">
                      À partir de {state.price}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#E6EDF5] px-3 py-1 text-xs font-black text-[#123A63]">
                    LLC
                  </span>
                </div>

                <p className="mt-6 text-sm font-bold leading-7 text-slate-500">
                  {state.text}
                </p>

                <div className="mt-5 rounded-[16px] border border-[#E6EDF5] bg-white p-4 text-sm font-black text-[#123A63]">
                  Registered Agent renouvellement : {state.renewal}
                </div>

                <div className="mt-5 grid gap-3">
                  {state.points.map((point) => (
                    <div key={point} className="flex items-center gap-3">
                      <Check />
                      <span className="text-sm font-bold text-[#123A63]">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="rounded-[12px] border border-[#E6EDF5] bg-white px-4 py-2 text-sm font-black text-[#F15A24]">
            Step up to success
          </span>
          <h2 className="mt-8 text-[38px] font-black leading-tight tracking-[-0.065em] md:text-[52px]">
            Nos consultants vous accompagnent en 4 étapes simples
          </h2>
        </div>

        <div className="space-y-7">
          {steps.map(([number, title, text]) => (
            <div key={number} className="grid gap-4 sm:grid-cols-[72px_1fr]">
              <p className="text-[34px] font-black tracking-[-0.06em] text-[#F15A24]">
                {number}.
              </p>
              <div>
                <h3 className="text-2xl font-black tracking-[-0.04em] text-[#111827]">
                  {title}
                </h3>
                <p className="mt-2 text-base font-bold leading-7 text-slate-500">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E6EDF5] bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#F15A24]">
                Packs
              </p>
              <h2 className="mt-4 text-[36px] font-black tracking-[-0.065em] text-[#111827] md:text-[52px]">
                Des formules simples et lisibles.
              </h2>
            </div>
            <Link href="/fr/tarifs" className="rounded-[16px] bg-[#F15A24] px-5 py-3 text-sm font-black text-white hover:bg-[#DB4F1C]">
              Comparer les packs
            </Link>
          </div>

          <div className="mt-10 space-y-10">
            {packGroups.map((group) => (
              <div key={group.state}>
                <h3 className="text-2xl font-black tracking-[-0.05em] text-[#123A63]">
                  {group.state}
                </h3>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  {group.packs.map((pack) => (
                    <div key={`${group.state}-${pack.name}`} className="rounded-[28px] border border-[#E6EDF5] bg-white p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-black tracking-[-0.05em] text-[#111827]">
                            {pack.name}
                          </h4>
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            {group.state}
                          </p>
                        </div>
                        {pack.recommended ? (
                          <span className="rounded-full bg-[#F15A24] px-3 py-1 text-xs font-black text-white">
                            Recommandé
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-5 text-[42px] font-black leading-none tracking-[-0.075em] text-[#123A63]">
                        {pack.price}
                      </p>
                      <p className="mt-4 text-sm font-bold leading-7 text-slate-500">
                        {pack.text}
                      </p>

                      <div className="mt-6 space-y-3">
                        {pack.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-3">
                            <Check />
                            <span className="text-sm font-bold text-[#123A63]">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={`/fr/commencer?state=${encodeURIComponent(group.state)}&plan=${pack.name.toLowerCase()}`}
                        className={pack.recommended ? "mt-7 flex justify-center rounded-[16px] bg-[#F15A24] px-5 py-4 text-sm font-black text-white hover:bg-[#DB4F1C]" : "mt-7 flex justify-center rounded-[16px] border border-[#E6EDF5] bg-white px-5 py-4 text-sm font-black text-[#123A63] hover:border-[#F15A24] hover:text-[#F15A24]"}
                      >
                        Choisir {pack.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[28px] border border-[#E6EDF5] bg-white p-8 text-center md:p-12">
          <h2 className="text-[34px] font-black tracking-[-0.06em] md:text-[52px]">
            Prêt à créer votre LLC ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-slate-500">
            Commencez votre dossier, choisissez votre formule et suivez chaque étape depuis VEMO.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/fr/commencer" className="rounded-[16px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white hover:bg-[#DB4F1C]">
              Créer ma LLC
            </Link>
            <Link href="/fr/ein" className="rounded-[16px] border border-[#E6EDF5] bg-white px-6 py-4 text-sm font-black text-[#123A63] hover:border-[#F15A24] hover:text-[#F15A24]">
              EIN application seule
            </Link>
            <Link href="/fr/contact" className="rounded-[16px] border border-[#E6EDF5] bg-white px-6 py-4 text-sm font-black text-[#123A63] hover:border-[#F15A24] hover:text-[#F15A24]">
              Contacter VEMO
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppButton />

      <footer className="border-t border-[#0F3558] bg-[#123A63] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
          <div>
            <p className="text-2xl font-black tracking-[-0.05em] text-white">
              VEMO<span className="text-[#F15A24]">TECH</span>
            </p>
            <p className="mt-5 max-w-xs text-sm font-bold leading-7 text-white/75">
              Accompagnement professionnel pour créer, structurer et suivre votre LLC US à distance.
            </p>
          </div>

          <div>
            <p className="text-sm font-black text-white">Navigation</p>
            <div className="mt-5 space-y-3 text-sm font-bold text-white/70">
              <Link href="/fr" className="block hover:text-white">Accueil</Link>
              <Link href="/fr/tarifs" className="block hover:text-white">Tarifs</Link>
              <Link href="/fr/contact" className="block hover:text-white">Contact</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-white">Services</p>
            <div className="mt-5 space-y-3 text-sm font-bold text-white/70">
              <Link href="/fr/commencer" className="block hover:text-white">LLC Formation</Link>
              <Link href="/fr/ein" className="block hover:text-white">EIN</Link>
              <Link href="/fr/banking-guidance" className="block hover:text-white">Banking Guidance</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-white">Legal</p>
            <div className="mt-5 space-y-3 text-sm font-bold text-white/70">
              <Link href="/fr/conditions" className="block hover:text-white">Terms</Link>
              <Link href="/fr/confidentialite" className="block hover:text-white">Privacy</Link>
              <Link href="/fr/remboursement" className="block hover:text-white">Refund Policy</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-5 text-center text-xs font-black text-white/60">
          © 2026 Vemo Technology. All rights reserved.
        </div>
      </footer>
    </main>
    </>
  );
}
