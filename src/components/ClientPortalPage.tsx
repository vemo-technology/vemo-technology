"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Lang = "fr" | "en";

type PortalPayload = {
  ok: boolean;
  email: string;
  account: any;
  order: any;
  documents: any[];
  messages: any[];
  error?: string;
  details?: string;
};

const copy = {
  fr: {
    portal: "Espace client",
    home: "Accueil",
    documents: "Documents",
    messages: "Messages",
    logout: "Déconnexion",
    hello: "Bonjour",
    progress: "Progression du dossier",
    package: "Pack",
    state: "État",
    payment: "Paiement",
    status: "Statut",
    confirmed: "Confirmé",
    docsTitle: "Documents",
    docsText: "Prévisualisez et téléchargez vos documents officiels LLC.",
    previewTitle: "Aperçu du document",
    noPreview: "Sélectionnez un document disponible pour afficher l’aperçu.",
    messagesTitle: "Messages",
    noDocs: "Aucun document disponible pour le moment.",
    noMessages: "Aucun message pour le moment.",
    loading: "Chargement de votre espace client...",
    accessDenied: "Accès impossible",
    notConnected: "Vous devez vous connecter pour accéder à votre espace client.",
    notFound: "Espace client introuvable",
    contact: "Contacter Vemo",
    login: "Se connecter",
    preview: "Prévisualiser",
    openPreview: "Ouvrir l’aperçu",
    download: "Télécharger",
    downloadPdf: "Télécharger PDF",
    available: "Disponible",
    pending: "À venir",
    soon: "Bientôt",
    allStatuses: "Tous les statuts",
    searchDocs: "Rechercher un document...",
    writeMessage: "Écrire un message...",
    send: "Envoyer",
    replyNote: "Nous répondons généralement sous 1 jour ouvré.",
    noNewMessages: "Aucun nouveau message",
  },
  en: {
    portal: "Client portal",
    home: "Home",
    documents: "Documents",
    messages: "Messages",
    logout: "Log Out",
    hello: "Hello",
    progress: "Case progress",
    package: "Package",
    state: "State",
    payment: "Payment",
    status: "Status",
    confirmed: "Confirmed",
    docsTitle: "Documents",
    docsText: "Preview and download your official LLC documents.",
    previewTitle: "Document preview",
    noPreview: "Select an available document to display the preview.",
    messagesTitle: "Messages",
    noDocs: "No documents available yet.",
    noMessages: "No messages yet.",
    loading: "Loading your client portal...",
    accessDenied: "Access denied",
    notConnected: "You must log in to access your client portal.",
    notFound: "Client portal not found",
    contact: "Contact Vemo",
    login: "Log in",
    preview: "Preview",
    openPreview: "Open preview",
    download: "Download",
    downloadPdf: "Download PDF",
    available: "Available",
    pending: "Coming soon",
    soon: "Soon",
    allStatuses: "All statuses",
    searchDocs: "Search documents...",
    writeMessage: "Write a message...",
    send: "Send",
    replyNote: "We typically reply within 1 business day.",
    noNewMessages: "No new messages",
  },
};

function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;

  return createClient(url, anon);
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function docIcon(key?: string) {
  if (key === "ein_letter") return "EIN";
  if (key === "operating_agreement") return "OA";
  if (key === "company_document") return "LLC";
  return "DOC";
}

function formatDate(value?: string, lang: Lang = "en") {
  if (!value) return "";

  return new Date(value).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function ClientPortalPage({ lang }: { lang: Lang }) {
  const t = copy[lang];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<PortalPayload | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDocId, setSelectedDocId] = useState("");

  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  const supabase = useMemo(() => getSupabaseBrowser(), []);

  async function loadPortal() {
    setLoading(true);
    setError("");

    try {
      if (!supabase) {
        throw new Error(
          "Supabase public variables missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError(t.notConnected);
        setLoading(false);
        return;
      }

      const response = await fetch("/api/client-portal/order", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || t.notFound);
      }

      setPayload(result);

      const firstAvailable = (result.documents || []).find(
        (doc: any) => doc.file_url || doc.status === "available"
      );

      if (firstAvailable?.id && !selectedDocId) {
        setSelectedDocId(firstAvailable.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.notFound);
    } finally {
      setLoading(false);
    }
  }

  async function sendClientReply() {
    const message = replyText.trim();

    if (!message || sendingReply) return;

    setReplyError("");
    setSendingReply(true);

    try {
      if (!supabase) {
        throw new Error("Supabase unavailable.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(t.notConnected);
      }

      const response = await fetch("/api/client-portal/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Message not sent.");
      }

      setReplyText("");
      await loadPortal();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Message not sent.");
    } finally {
      setSendingReply(false);
    }
  }

  async function logout() {
    await supabase?.auth.signOut();
    window.location.href = `/${lang}/connexion`;
  }

  useEffect(() => {
    loadPortal();
  }, []);

  const account = payload?.account;
  const paymentVerificationBanner =
    account?.payment_status === "pending_verification" ||
    account?.status === "payment_verification";
  const order = payload?.order;
  const documents = payload?.documents || [];
  const messages = payload?.messages || [];

  const companyName =
    account?.company_name ||
    order?.company_name ||
    order?.full_company_name ||
    "Client LLC";

  const packageName =
    account?.plan_name || order?.package_name || order?.plan_name || "-";

  const state = order?.jurisdiction || order?.state || "-";

  const filteredDocuments = documents.filter((doc) => {
    const available = Boolean(doc.file_url) || doc.status === "available";

    const text = `${doc.title || ""} ${doc.document_key || ""} ${
      doc.file_name || ""
    }`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && available) ||
      (statusFilter === "pending" && !available);

    return matchesSearch && matchesStatus;
  });

  const selectedDocument =
    documents.find((doc) => doc.id === selectedDocId) ||
    documents.find((doc) => doc.file_url || doc.status === "available") ||
    null;

  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href={`/${lang}/espace-client`} className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F15A24] text-xl font-black text-white shadow-lg shadow-orange-900/20">
              V
            </span>
            <span>
              <span className="block text-2xl font-black tracking-[-0.05em]">
                Vemo Technology
              </span>
              <span className="block text-xs font-bold text-slate-500">
                {t.portal}
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-10 text-sm font-black md:flex">
            <a href={`/${lang}/espace-client`}>{t.home}</a>
            <a
              href={`/${lang}/espace-client#documents`}
              className="border-b-2 border-[#F15A24] pb-2 text-[#F15A24]"
            >
              {t.documents}
            </a>
            <a href={`/${lang}/espace-client#messages`}>{t.messages}</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <a
                href="/fr/espace-client"
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-black",
                  lang === "fr" ? "bg-[#F15A24] text-white" : "text-slate-700"
                )}
              >
                FR
              </a>
              <a
                href="/en/client-portal"
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-black",
                  lang === "en" ? "bg-[#F15A24] text-white" : "text-slate-700"
                )}
              >
                EN
              </a>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {loading && (
          <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center shadow-xl shadow-slate-200/70">
            <p className="text-sm font-black text-slate-500">{t.loading}</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-xl shadow-slate-200/70">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-red-600">
              {t.accessDenied}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.06em]">
              {t.notFound}
            </h1>
            <p className="mt-4 text-sm font-bold text-slate-500">{error}</p>

            <div className="mt-8 flex justify-center gap-3">
              <a
                href={`/${lang}/connexion`}
                className="rounded-2xl bg-[#F15A24] px-6 py-4 text-sm font-black text-white"
              >
                {t.login}
              </a>
              <a
                href={`/${lang}/contact`}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black"
              >
                {t.contact}
              </a>
            </div>
          </div>
        )}

        {!loading && !error && payload && (
          <>
            {paymentVerificationBanner && (
              <div className="mb-6 rounded-[1.7rem] border border-amber-100 bg-amber-50 p-6 shadow-lg shadow-amber-900/5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
                  {lang === "fr" ? "Paiement en vérification" : "Payment verification"}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {lang === "fr"
                    ? "Paiement en cours de vérification"
                    : "Payment pending verification"}
                </h2>
                <p className="mt-2 text-sm font-bold leading-7 text-amber-900/70">
                  {lang === "fr"
                    ? "Votre justificatif a bien été reçu. L’équipe Vemo vérifie votre paiement avant de finaliser le traitement de votre dossier."
                    : "Your payment proof has been received. Vemo is verifying your payment before finalizing your case processing."}
                </p>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section
              id="documents"
              className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/70"
            >
              <div className="border-b border-slate-100 p-8">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F15A24]">
                  Vemo Documents
                </p>

                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="text-4xl font-black tracking-[-0.06em] md:text-5xl">
                      {t.docsTitle}
                    </h1>
                    <p className="mt-3 text-sm font-bold leading-7 text-slate-500">
                      {t.docsText}
                    </p>
                  </div>

                  <div className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#F15A24]">
                    {documents.length} {t.documents}
                  </div>
                </div>

                <div className="mt-7 grid gap-3 md:grid-cols-[1fr_210px]">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t.searchDocs}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                  >
                    <option value="all">{t.allStatuses}</option>
                    <option value="available">{t.available}</option>
                    <option value="pending">{t.pending}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-6">
                {filteredDocuments.length === 0 && (
                  <div className="rounded-[1.5rem] border border-slate-100 bg-white p-6">
                    <p className="text-sm font-bold text-slate-500">
                      {t.noDocs}
                    </p>
                  </div>
                )}

                {filteredDocuments.map((doc) => {
                  const available = Boolean(doc.file_url) || doc.status === "available";
                  const active = selectedDocument?.id === doc.id;

                  return (
                    <article
                      key={doc.id || doc.document_key || doc.title}
                      className={cn(
                        "rounded-[1.6rem] border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70",
                        active ? "border-[#F15A24]" : "border-slate-100"
                      )}
                    >
                      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="flex items-start gap-5">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#F15A24] text-sm font-black text-white shadow-lg shadow-orange-900/20">
                            {docIcon(doc.document_key)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-black leading-6">
                                {doc.title || doc.document_key || "Document"}
                              </h3>

                              <span
                                className={cn(
                                  "rounded-full px-4 py-2 text-xs font-black",
                                  available
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                )}
                              >
                                {available ? t.available : t.pending}
                              </span>
                            </div>

                            <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                              {doc.document_key || "document"}
                            </p>

                            <p className="mt-4 text-sm font-bold leading-7 text-slate-500">
                              {doc.admin_comment ||
                                (available
                                  ? lang === "fr"
                                    ? "Document disponible au téléchargement."
                                    : "Document available for download."
                                  : lang === "fr"
                                    ? "Document en cours de préparation."
                                    : "Document is being prepared.")}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-black text-slate-400">
                              {doc.updated_at && (
                                <span>{formatDate(doc.updated_at, lang)}</span>
                              )}

                              {doc.file_name && (
                                <span className="max-w-[260px] truncate rounded-full bg-slate-50 px-4 py-2 text-slate-500">
                                  {doc.file_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 lg:justify-end">
                          {doc.file_url ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedDocId(doc.id)}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#F15A24] transition hover:border-[#F15A24]"
                              >
                                {t.preview}
                              </button>

                              <a
                                href={doc.file_url}
                                target="_self"
                                download
                                className="rounded-2xl bg-[#F15A24] px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-900/20"
                              >
                                {t.download}
                              </a>
                            </>
                          ) : (
                            <span className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-400">
                              {t.soon}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 bg-white px-8 py-5 text-center text-xs font-bold text-slate-400">
                {lang === "fr"
                  ? "Les documents sont ajoutés au fur et à mesure de leur disponibilité."
                  : "Documents are added as they become available."}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/70">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
                  <h2 className="text-xl font-black tracking-[-0.04em]">
                    {t.previewTitle}
                  </h2>

                  {selectedDocument?.file_url && (
                    <a
                      href={selectedDocument.file_url}
                      target="_self"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 hover:text-[#F15A24]"
                    >
                      ↗
                    </a>
                  )}
                </div>

                {selectedDocument?.file_url ? (
                  <div className="p-6">
                    <div className="mb-4">
                      <p className="text-lg font-black">
                        {selectedDocument.title || "Document"}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {selectedDocument.document_key || "document"} •{" "}
                        {formatDate(selectedDocument.updated_at, lang)}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {String(selectedDocument.file_url).toLowerCase().includes(".pdf") ? (
                        <iframe
                          src={selectedDocument.file_url}
                          className="h-[420px] w-full bg-white"
                        />
                      ) : (
                        <img
                          src={selectedDocument.file_url}
                          alt={selectedDocument.title || "Document"}
                          className="h-[420px] w-full object-contain bg-white"
                        />
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <a
                        href={selectedDocument.file_url}
                        target="_self"
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-[#F15A24]"
                      >
                        {t.openPreview}
                      </a>

                      <a
                        href={selectedDocument.file_url}
                        target="_self"
                        download
                        className="rounded-2xl bg-[#F15A24] px-5 py-4 text-center text-sm font-black text-white shadow-lg shadow-orange-900/20"
                      >
                        {t.downloadPdf}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                      <p className="text-sm font-bold leading-7 text-slate-500">
                        {t.noPreview}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section
                id="messages"
                className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/70"
              >
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
                      Vemo Messenger
                    </p>
                    <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">
                      {t.messagesTitle}
                    </h2>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                    {messages.length === 0 ? t.noNewMessages : messages.length}
                  </span>
                </div>

                <div className="max-h-[260px] space-y-4 overflow-y-auto bg-slate-50 p-5">
                  {messages.length === 0 && (
                    <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
                      <p className="text-sm font-bold text-slate-500">
                        {t.noMessages}
                      </p>
                    </div>
                  )}

                  {messages.map((message) => {
                    const isClient = message.sender === "client";

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isClient ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-[1.5rem] p-4 shadow-sm",
                            isClient
                              ? "rounded-tr-md bg-[#F15A24] text-white"
                              : "rounded-tl-md border border-slate-100 bg-white text-slate-950"
                          )}
                        >
                          {!isClient && message.subject && (
                            <p className="text-sm font-black">
                              {message.subject}
                            </p>
                          )}

                          <p
                            className={cn(
                              "whitespace-pre-line text-sm font-bold leading-7",
                              isClient ? "text-white/90" : "text-slate-600"
                            )}
                          >
                            {message.message || message.content || ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 bg-white p-5">
                  <div className="flex gap-3">
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder={t.writeMessage}
                      className="min-h-[54px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                    />

                    <button
                      type="button"
                      onClick={sendClientReply}
                      disabled={sendingReply || replyText.trim().length === 0}
                      className="rounded-2xl bg-[#F15A24] px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingReply ? "..." : t.send}
                    </button>
                  </div>

                  {replyError && (
                    <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black text-red-700">
                      {replyError}
                    </p>
                  )}

                  <p className="mt-4 text-xs font-bold text-slate-400">
                    {t.replyNote}
                  </p>
                </div>
              </section>
            </aside>
          </div></>
        )}
      </section>
    </main>
  );
}