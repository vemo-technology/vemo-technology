"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "fr" | "en";

type Profile = {
  email?: string;
  client_email?: string;
  full_name?: string;
  llc_name?: string;
  phone?: string;
  state?: string;
  dossier_number?: string;
  package_name?: string;
  amount?: string | number;
  currency?: string;
  payment_status?: string;
  dossier_status?: string;
  created_at?: string;
};

type DocumentRow = {
  id?: string;
  title?: string;
  document_type?: string;
  file_name?: string;
  file_url?: string;
  status?: string;
  created_at?: string;
};

type MessageRow = {
  id?: string;
  sender?: string;
  message?: string;
  created_at?: string;
};

const copy = {
  fr: {
    space: "ESPACE CLIENT",
    title: "Votre dossier LLC",
    subtitle: "Suivez l’avancement de votre dossier, consultez vos documents et échangez avec l’équipe VEMO.",
    logout: "Déconnexion",
    refresh: "Actualiser",
    documents: "Documents",
    messages: "Messages",
    overview: "Vue dossier",
    noDocuments: "Aucun document disponible pour le moment.",
    noMessages: "Aucun message pour le moment.",
    send: "Envoyer",
    messagePlaceholder: "Écrire un message à VEMO...",
    view: "Voir",
    download: "Télécharger",
    clientInfo: "Informations client",
    fullName: "Nom complet",
    llcName: "Nom LLC",
    state: "État LLC",
    phone: "Téléphone",
    email: "Email",
    dossierNo: "N° dossier",
    pack: "Pack",
    created: "Date création",
    payment: "Paiement",
    dossier: "Dossier",
    loading: "Chargement de votre espace...",
    missingEmail: "Email client manquant. Ajoute ?email=votre@email.com dans l’URL pour le test local.",
    successMsg: "Message envoyé.",
  },
  en: {
    space: "CLIENT SPACE",
    title: "Your LLC file",
    subtitle: "Track your file progress, view your documents and communicate with the VEMO team.",
    logout: "Log out",
    refresh: "Refresh",
    documents: "Documents",
    messages: "Messages",
    overview: "File overview",
    noDocuments: "No document available yet.",
    noMessages: "No message yet.",
    send: "Send",
    messagePlaceholder: "Write a message to VEMO...",
    view: "View",
    download: "Download",
    clientInfo: "Client information",
    fullName: "Full name",
    llcName: "LLC name",
    state: "LLC state",
    phone: "Phone",
    email: "Email",
    dossierNo: "File no.",
    pack: "Package",
    created: "Created",
    payment: "Payment",
    dossier: "File",
    loading: "Loading your space...",
    missingEmail: "Client email missing. Add ?email=your@email.com to the URL for local testing.",
    successMsg: "Message sent.",
  },
};

function fmtDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("fr-FR");
  } catch {
    return "—";
  }
}

function fmtTime(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return "";
  }
}

function cleanStatus(value?: string) {
  return String(value || "").replace(/[_-]+/g, " ").trim().toLowerCase();
}

function paymentLabel(value?: string, lang: Lang = "fr") {
  const raw = cleanStatus(value);

  if (!raw) return lang === "fr" ? "En attente de vérification" : "Pending verification";
  if (raw.includes("paid") || raw.includes("confirmed") || raw.includes("payé")) {
    return lang === "fr" ? "Paiement confirmé" : "Payment confirmed";
  }
  if (raw.includes("unpaid")) return lang === "fr" ? "Non payé" : "Unpaid";
  if (raw.includes("pending") || raw.includes("verification") || raw.includes("attente")) {
    return lang === "fr" ? "En attente de vérification" : "Pending verification";
  }
  if (raw.includes("reject") || raw.includes("rejet")) return lang === "fr" ? "Paiement rejeté" : "Payment rejected";

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function dossierLabel(value?: string, lang: Lang = "fr") {
  const raw = cleanStatus(value);

  if (!raw) return lang === "fr" ? "En cours" : "In progress";
  if (raw.includes("new")) return lang === "fr" ? "Nouveau dossier" : "New file";
  if (raw.includes("progress") || raw.includes("cours")) return lang === "fr" ? "En cours" : "In progress";
  if (raw.includes("waiting client")) return lang === "fr" ? "En attente client" : "Waiting for client";
  if (raw.includes("documents received")) return lang === "fr" ? "Documents reçus" : "Documents received";
  if (raw.includes("completed") || raw.includes("done")) return lang === "fr" ? "Terminé" : "Completed";
  if (raw.includes("suspended")) return lang === "fr" ? "Suspendu" : "Suspended";

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function badge(label: string, raw?: string) {
  const status = cleanStatus(raw || label);
  const cls =
    status.includes("paid") || status.includes("confirmed") || status.includes("completed") || status.includes("done")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status.includes("pending") || status.includes("waiting") || status.includes("progress") || status.includes("unpaid")
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : status.includes("reject") || status.includes("suspended")
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${cls}`}>{label}</span>;
}

function InfoCard({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-[1.4rem] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-[#123A63]">{value || "—"}</p>
    </div>
  );
}

function documentActionUrl(doc: DocumentRow, mode: "view" | "download") {
  if (!doc.id) return "";
  return `/api/client-portal/documents/file?id=${encodeURIComponent(doc.id)}&mode=${mode}`;
}

function hasDocumentFile(doc: DocumentRow) {
  return Boolean(doc.id);
}



function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M14 3v6h5M8 14h8M8 18h6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function VemoClientSpacePremium({ lang = "fr" }: { lang?: Lang }) {
  const t = copy[lang];

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const clientEmail = useMemo(() => email || profile?.email || profile?.client_email || "", [email, profile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = String(params.get("email") || "").trim().toLowerCase();
    const storedEmail = String(localStorage.getItem("vemo_client_email") || "").trim().toLowerCase();
    const finalEmail = urlEmail || storedEmail;

    if (finalEmail) {
      localStorage.setItem("vemo_client_email", finalEmail);
      setEmail(finalEmail);
      loadAll(finalEmail);
    } else {
      setLoading(false);
      setError(t.missingEmail);
    }
  }, []);

  async function loadAll(currentEmail = clientEmail) {
    if (!currentEmail) return;

    setLoading(true);
    setError("");

    try {
      const [profileRes, docsRes, messagesRes] = await Promise.all([
        fetch(`/api/client-portal/profile?email=${encodeURIComponent(currentEmail)}`, { cache: "no-store" }),
        fetch(`/api/client-portal/documents?email=${encodeURIComponent(currentEmail)}`, { cache: "no-store" }),
        fetch(`/api/client-portal/messages?email=${encodeURIComponent(currentEmail)}`, { cache: "no-store" }),
      ]);

      const profileData = await profileRes.json().catch(() => null);
      const docsData = await docsRes.json().catch(() => null);
      const messagesData = await messagesRes.json().catch(() => null);

      setProfile(profileData?.profile || { email: currentEmail, client_email: currentEmail });
      setDocuments(Array.isArray(docsData?.documents) ? docsData.documents : []);
      if (Array.isArray(docsData?.documents)) console.table(docsData.documents);
      setMessages(Array.isArray(messagesData?.messages) ? messagesData.messages : []);

      if (profileData?.error) setError(profileData.error);
      if (docsData?.error) setError(docsData.error);
      if (messagesData?.error) setError(messagesData.error);
    } catch {
      setError(lang === "fr" ? "Erreur réseau pendant le chargement." : "Network error while loading.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const text = message.trim();

    if (!text || !clientEmail) return;

    try {
      const res = await fetch("/api/client-portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clientEmail, message: text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false || data?.error) {
        setError(data?.error || "Erreur envoi message.");
        return;
      }

      setMessage("");
      setNotice(t.successMsg);
      setTimeout(() => setNotice(""), 3500);
      await loadAll(clientEmail);
    } catch {
      setError(lang === "fr" ? "Erreur réseau pendant l’envoi." : "Network error while sending.");
    }
  }

  function logout() {
    localStorage.removeItem("vemo_client_email");
    window.location.href = lang === "fr" ? "/fr" : "/en";
  }

  return (
    <main className="min-h-screen bg-[#F7FAFC] text-[#111827]">
      <header className="border-b border-[#E8E2DC] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href={lang === "fr" ? "/fr" : "/en"} className="leading-none">
            <div className="text-[28px] font-black tracking-[-0.06em] text-[#123A63]">
              VEMO<span className="text-[#F15A24]">TECH</span>
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">
              {t.space}
            </div>
          </a>

          <div className="flex items-center gap-3">
            <div className="flex items-center border-r border-[#E8E2DC] pr-4">
              {lang === "fr" ? (
                <a
                  href={`/en/client-portal${clientEmail ? `?email=${encodeURIComponent(clientEmail)}` : ""}`}
                  className="px-2 text-sm font-black text-[#111827] transition hover:text-[#F15A24]"
                >
                  EN
                </a>
              ) : (
                <a
                  href={`/fr/espace-client${clientEmail ? `?email=${encodeURIComponent(clientEmail)}` : ""}`}
                  className="px-2 text-sm font-black text-[#111827] transition hover:text-[#F15A24]"
                >
                  FR
                </a>
              )}
            </div>
            <button
              onClick={() => loadAll(clientEmail)}
              className="rounded-[16px] border border-[#E8E2DC] bg-white px-5 py-3 text-sm font-black text-[#123A63] transition hover:bg-[#FFF7F1] hover:text-[#F15A24]"
            >
              {t.refresh}
            </button>

            <button
              onClick={logout}
              className="rounded-[16px] bg-[#F15A24] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(241,90,36,.16)] transition hover:bg-[#D94A1B]"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[2.5rem] border border-[#E8E2DC] bg-white p-8 shadow-[0_24px_70px_rgba(18,58,99,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F15A24]">{t.overview}</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#111827]">
                {profile?.llc_name || t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-500">
                {t.subtitle}
              </p>
            </div>

            <div className="grid min-w-[320px] gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t.payment}</p>
                <div className="mt-2">{badge(paymentLabel(profile?.payment_status, lang), profile?.payment_status)}</div>
              </div>
              <div className="rounded-[1.4rem] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{t.dossier}</p>
                <div className="mt-2">{badge(dossierLabel(profile?.dossier_status, lang), profile?.dossier_status)}</div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-5 rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-black text-slate-500">
            {t.loading}
          </div>
        )}

        {notice && (
          <div className="mt-5 rounded-[18px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-[18px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard label={t.fullName} value={profile?.full_name} />
          <InfoCard label={t.llcName} value={profile?.llc_name} />
          <InfoCard label={t.state} value={profile?.state} />
          <InfoCard label={t.dossierNo} value={profile?.dossier_number} />
          <InfoCard label={t.phone} value={profile?.phone} />
          <InfoCard label={t.email} value={clientEmail} />
          <InfoCard label={t.pack} value={profile?.package_name} />
          <InfoCard label={t.created} value={fmtDate(profile?.created_at)} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.2rem] border border-[#E8E2DC] bg-white p-7 shadow-[0_18px_45px_rgba(18,58,99,0.06)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F15A24]">{t.documents}</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">{t.documents}</h2>
              </div>

              <div className="rounded-full border border-[#FFD2C2] bg-[#FFF7F1] px-4 py-2 text-xs font-black text-[#F15A24]">
                {documents.length} document(s)
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-[#E8E2DC] bg-white">
              {documents.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm font-black text-slate-500">
                  {t.noDocuments}
                </div>
              ) : (
                <div className="divide-y divide-[#E8E2DC]">
                  {documents.map((doc, index) => (
                    <div key={doc.id || index} className="grid gap-4 px-5 py-5 md:grid-cols-[42px_1fr_130px_190px] md:items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#FFF7F1] text-[#F15A24]">
                        <DocumentIcon />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#111827]">
                          {doc.title || doc.document_type || doc.file_name || "Document"}
                        </p>
                        <p className="mt-1 truncate text-xs font-bold text-slate-500">
                          {doc.file_name || doc.document_type || "—"}
                        </p>
                      </div>

                      <div className="text-sm font-black text-[#123A63]">
                        {fmtDate(doc.created_at)}
                      </div>

                      <div className="flex justify-start gap-2 md:justify-end">
                        <a
                          href={hasDocumentFile(doc) ? documentActionUrl(doc, "view") : "#"}
                          target="_self"
                          rel="noreferrer"
                          aria-disabled={!hasDocumentFile(doc)}
                          className={`inline-flex h-10 items-center justify-center rounded-[13px] border px-4 text-xs font-black transition ${
                            hasDocumentFile(doc)
                              ? "border-[#E8E2DC] bg-white text-[#123A63] hover:border-[#F15A24]/30 hover:bg-[#FFF7F1] hover:text-[#F15A24]"
                              : "pointer-events-none border-slate-100 bg-slate-50 text-slate-300"
                          }`}
                        >
                          {t.view}
                        </a>
                        <a
                          href={hasDocumentFile(doc) ? documentActionUrl(doc, "download") : "#"}
                          aria-disabled={!hasDocumentFile(doc)}
                          className={`inline-flex h-10 items-center justify-center rounded-[13px] px-4 text-xs font-black shadow-[0_10px_22px_rgba(241,90,36,.16)] transition ${
                            hasDocumentFile(doc)
                              ? "bg-[#F15A24] text-white hover:bg-[#D94A1B]"
                              : "pointer-events-none bg-slate-100 text-slate-300 shadow-none"
                          }`}
                        >
                          {t.download}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-[#E8E2DC] bg-white p-7 shadow-[0_18px_45px_rgba(18,58,99,0.06)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F15A24]">{t.messages}</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">{t.messages}</h2>

            <div className="mt-6 max-h-[420px] space-y-3 overflow-auto rounded-[1.8rem] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm font-black text-slate-500">{t.noMessages}</p>
              ) : (
                messages.map((m, index) => {
                  const isClient = String(m.sender || "").toLowerCase().includes("client");

                  return (
                    <div
                      key={m.id || index}
                      className={`rounded-[18px] border p-4 ${
                        isClient
                          ? "ml-8 border-[#FFD2C2] bg-[#FFF7F1]"
                          : "mr-8 border-[#E8E2DC] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F15A24]">
                          {isClient ? "Client" : "VEMO"}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400">{fmtTime(m.created_at)}</p>
                      </div>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{m.message}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                className="min-h-[130px] w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-bold outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
              />
              <button
                onClick={sendMessage}
                className="mt-4 w-full rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(241,90,36,.20)] transition hover:bg-[#D94A1B]"
              >
                {t.send} →
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
