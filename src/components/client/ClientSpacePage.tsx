"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

type Lang = "fr" | "en";

type ClientDocument = {
  id: string;
  created_at: string;
  uploaded_by: string;
  document_type: string;
  document_label: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  status: string;
  admin_comment: string | null;
  reviewed_at: string | null;
  signed_url: string | null;
};

type ClientOrder = {
  id: string;
  created_at: string;
  language: string | null;
  status: string | null;
  payment_status: string | null;
  admin_status: string | null;
  package_name: string | null;
  jurisdiction: string | null;
  full_company_name: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_e164: string | null;
  residence_country: string | null;
  total_amount: number | null;
  currency: string | null;
  processed_at: string | null;
  admin_updated_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function adminStatusLabel(status: string | null, lang: Lang) {
  const fr: Record<string, string> = {
    new: "Dossier reçu",
    paid_to_process: "Paiement confirmé, dossier à traiter",
    in_progress: "Traitement en cours",
    waiting_client: "En attente d’information client",
    documents_prepared: "Documents préparés",
    completed: "Dossier terminé",
    cancelled: "Dossier annulé",
  };

  const en: Record<string, string> = {
    new: "Case received",
    paid_to_process: "Payment confirmed, case to process",
    in_progress: "Processing",
    waiting_client: "Waiting for client information",
    documents_prepared: "Documents prepared",
    completed: "Case completed",
    cancelled: "Case cancelled",
  };

  return (lang === "fr" ? fr : en)[status || "new"] || (lang === "fr" ? "Dossier reçu" : "Case received");
}

function progressValue(status: string | null) {
  const values: Record<string, number> = {
    new: 20,
    paid_to_process: 35,
    in_progress: 55,
    waiting_client: 60,
    documents_prepared: 80,
    completed: 100,
    cancelled: 0,
  };

  return values[status || "new"] || 20;
}

function StepCard({
  title,
  description,
  active,
  done,
}: {
  title: string;
  description: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1.5rem] border p-5",
        done
          ? "border-green-200 bg-green-50"
          : active
            ? "border-rose-200 bg-rose-50"
            : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <p className="text-lg font-black">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default function ClientSpacePage({ lang }: { lang: Lang }) {
  const isFr = lang === "fr";

  const [token, setToken] = useState("");
  const [order, setOrder] = useState<ClientOrder | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token") || "";

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      loadOrder(tokenFromUrl);
      loadDocuments(tokenFromUrl);
    }
  }, []);

  async function loadOrder(tokenValue = token) {
    setLoading(true);
    setErrorMessage("");
    setOrder(null);

    const cleanToken = tokenValue.trim();

    if (!cleanToken) {
      setErrorMessage(
        isFr
          ? "Collez votre lien privé ou votre token d’accès."
          : "Paste your private link or access token."
      );
      setLoading(false);
      return;
    }

    const response = await fetch(`/api/client/order?token=${encodeURIComponent(cleanToken)}`, {
      method: "GET",
      cache: "no-store",
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setErrorMessage(
        result.error ||
          (isFr
            ? "Impossible de charger votre dossier."
            : "Unable to load your case.")
      );
      return;
    }

    setOrder(result.order);
  }

  async function loadDocuments(tokenValue = token) {
    setDocumentsLoading(true);

    const cleanToken = tokenValue.trim();

    if (!cleanToken) {
      setDocuments([]);
      setDocumentsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/client/documents?token=${encodeURIComponent(cleanToken)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(result);
        setDocuments([]);
        setDocumentsLoading(false);
        return;
      }

      setDocuments(result.documents || []);
    } catch (error) {
      console.error(error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }

  const progress = useMemo(() => progressValue(order?.admin_status || order?.status || "new"), [order]);

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#111a33]">
      <SiteHeader lang={lang} active="home" />

      <section className="vemo-container py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="vemo-badge">
            {isFr ? "Espace client" : "Client space"}
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
            {isFr ? "Suivez votre dossier LLC." : "Track your LLC case."}
          </h1>

          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
            {isFr
              ? "Consultez l’avancement de votre dossier, votre paiement et les prochaines étapes."
              : "View your case progress, payment status and next steps."}
          </p>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">
              {isFr ? "Lien privé / token d’accès" : "Private link / access token"}
            </label>

            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder={
                  isFr
                    ? "Collez votre token d’accès..."
                    : "Paste your access token..."
                }
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-5 py-4 font-bold outline-none focus:border-[#9F1239]"
              />

              <button
                onClick={() => loadOrder()}
                disabled={loading}
                className="rounded-2xl bg-[#9F1239] px-6 py-4 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? isFr
                    ? "Chargement..."
                    : "Loading..."
                  : isFr
                    ? "Voir mon dossier"
                    : "View my case"}
              </button>
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-2xl bg-rose-50 px-5 py-4 text-sm font-black text-rose-700">
                {errorMessage}
              </div>
            )}
          </div>

          {order && (
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.42fr]">
              <div className="rounded-[2rem] bg-white p-8 shadow-sm">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9F1239]">
                  {isFr ? "Dossier LLC" : "LLC case"}
                </p>

                <h2 className="mt-3 text-4xl font-black">
                  {order.full_company_name || order.company_name || "US LLC"}
                </h2>

                <p className="mt-3 text-sm font-bold text-slate-500">
                  {isFr ? "Créé le" : "Created on"} {formatDate(order.created_at)}
                </p>

                <div className="mt-8 rounded-[2rem] bg-slate-50 p-6">
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {isFr ? "Statut actuel" : "Current status"}
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {adminStatusLabel(order.admin_status || order.status, lang)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {isFr ? "Progression" : "Progress"}
                      </p>
                      <p className="mt-2 text-3xl font-black text-[#9F1239]">
                        {progress}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#9F1239]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <StepCard
                    title={isFr ? "1. Paiement confirmé" : "1. Payment confirmed"}
                    description={
                      isFr
                        ? "Votre paiement est enregistré et lié à votre dossier."
                        : "Your payment is recorded and linked to your case."
                    }
                    done={order.payment_status === "paid"}
                  />

                  <StepCard
                    title={isFr ? "2. Vérification du dossier" : "2. Case review"}
                    description={
                      isFr
                        ? "Notre équipe vérifie les informations de votre LLC."
                        : "Our team reviews your LLC information."
                    }
                    active={["paid_to_process", "in_progress"].includes(order.admin_status || "")}
                    done={["documents_prepared", "completed"].includes(order.admin_status || "")}
                  />

                  <StepCard
                    title={isFr ? "3. Préparation documents" : "3. Document preparation"}
                    description={
                      isFr
                        ? "Les documents LLC sont préparés selon les informations fournies."
                        : "LLC documents are prepared based on your submitted information."
                    }
                    active={order.admin_status === "documents_prepared"}
                    done={order.admin_status === "completed"}
                  />

                  <StepCard
                    title={isFr ? "4. Finalisation" : "4. Completion"}
                    description={
                      isFr
                        ? "Votre dossier est finalisé ou prêt pour les prochaines démarches."
                        : "Your case is completed or ready for the next actions."
                    }
                    done={order.admin_status === "completed"}
                  />
                </div>

                <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-2xl font-black">
                        {isFr ? "Documents" : "Documents"}
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-7 text-slate-600">
                        {isFr
                          ? "Retrouvez ici les documents préparés ou partagés par Vemo Technology."
                          : "Find here the documents prepared or shared by Vemo Technology."}
                      </p>
                    </div>

                    <button
                      onClick={() => loadDocuments()}
                      className="rounded-2xl bg-[#111a33] px-5 py-3 text-sm font-black text-white"
                    >
                      {isFr ? "Actualiser" : "Refresh"}
                    </button>
                  </div>

                  {documentsLoading ? (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center font-black text-slate-500">
                      {isFr ? "Chargement des documents..." : "Loading documents..."}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-lg font-black">
                                {document.document_label}
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-500">
                                {document.file_name}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase text-slate-600">
                                  {document.status}
                                </span>

                                {document.admin_comment && (
                                  <span className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                                    {document.admin_comment}
                                  </span>
                                )}
                              </div>
                            </div>

                            {document.signed_url ? (
                              <a
                                href={document.signed_url}
                                target="_self"
                                rel="noreferrer"
                                className="rounded-2xl bg-[#9F1239] px-5 py-3 text-sm font-black text-white"
                              >
                                {isFr ? "Ouvrir / Télécharger" : "Open / Download"}
                              </a>
                            ) : (
                              <span className="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500">
                                {isFr ? "Lien indisponible" : "Link unavailable"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {documents.length === 0 && (
                        <div className="rounded-2xl bg-slate-50 p-6 text-center font-black text-slate-500">
                          {isFr
                            ? "Aucun document disponible pour le moment."
                            : "No documents available yet."}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <aside className="rounded-[2rem] bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-black">
                  {isFr ? "Résumé" : "Summary"}
                </h2>

                <div className="mt-6 space-y-5 text-sm">
                  <div className="flex justify-between gap-5">
                    <p className="font-bold text-slate-600">{isFr ? "Client" : "Client"}</p>
                    <p className="text-right font-black">
                      {[order.first_name, order.last_name].filter(Boolean).join(" ") || "-"}
                    </p>
                  </div>

                  <div className="flex justify-between gap-5">
                    <p className="font-bold text-slate-600">Email</p>
                    <p className="text-right font-black">{order.email || "-"}</p>
                  </div>

                  <div className="flex justify-between gap-5">
                    <p className="font-bold text-slate-600">{isFr ? "Téléphone" : "Phone"}</p>
                    <p className="text-right font-black">{order.phone_e164 || "-"}</p>
                  </div>

                  <div className="flex justify-between gap-5">
                    <p className="font-bold text-slate-600">{isFr ? "État" : "State"}</p>
                    <p className="text-right font-black">{order.jurisdiction || "-"}</p>
                  </div>

                  <div className="flex justify-between gap-5">
                    <p className="font-bold text-slate-600">{isFr ? "Formule" : "Package"}</p>
                    <p className="text-right font-black">{order.package_name || "-"}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-5">
                    <div className="flex justify-between gap-5">
                      <p className="text-xl font-black">Total</p>
                      <p className="text-2xl font-black text-[#9F1239]">
                        {order.total_amount || 0} {order.currency || "USD"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      {isFr ? "Paiement" : "Payment"}
                    </p>
                    <p className="mt-2 text-xl font-black text-green-700">
                      {order.payment_status || "pending"}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <SiteFooter lang={lang} />
    </main>
  );
}


