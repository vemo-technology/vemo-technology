"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "fr" | "en";
type Props = { lang: Lang };

type ClientRow = {
  email: string;
  label: string;
  documentsCount?: number;
  servicesCount?: number;
  messagesCount?: number;
};


function VemoIconOpen() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6" />
      <path d="M10 14L20 4" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function VemoIconDownload() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function VemoIconReplace() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17v-6h6" />
      <path d="M7.5 7.5A7 7 0 0 1 19 11" />
      <path d="M16.5 16.5A7 7 0 0 1 5 13" />
    </svg>
  );
}

function VemoIconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}


type Panel = "status" | "documents" | "services" | "messages";

const DEFAULT_EMAIL = "sheikh.abderrahim1@gmail.com";

export default function AdminClientPortalManager({ lang }: Props) {
  const isFr = lang === "fr";

  const t = isFr
    ? {
        title: "Gestion espace client",
        subtitle: "Sélectionnez un dossier client et gérez uniquement les éléments visibles dans son espace.",
        search: "Rechercher un dossier...",
        choose: "Choisir un dossier",
        opened: "Dossier ouvert",
        statusTab: "Statut",
        documentsTab: "Documents",
        servicesTab: "Services",
        messagesTab: "Messages",
        statusTitle: "Statut du dossier",
        payment: "Paiement",
        file: "Dossier",
        step: "Étape actuelle",
        save: "Enregistrer",
        documentsTitle: "Documents du dossier",
        docTitle: "Nom du document",
        upload: "Ajouter le document",
        noDocuments: "Aucun document pour ce dossier.",
        servicesTitle: "Services du dossier",
        serviceName: "Nom du service",
        serviceStatus: "Statut du service",
        serviceValue: "Détail / valeur",
        expiration: "Expiration",
        renewal: "Renouvellement",
        addService: "Ajouter le service",
        noServices: "Aucun service pour ce dossier.",
        messagesTitle: "Messages du dossier",
        subject: "Objet",
        message: "Message",
        reply: "Répondre au client",
        noMessages: "Aucun message pour ce dossier.",
        delete: "Supprimer",
        saved: "Enregistré.",
        loading: "Chargement...",
        counts: "éléments",
        serviceTemplates: [
          "Numéro téléphone US",
          "Registered Agent",
          "EIN",
          "Operating Agreement",
          "Assistance Stripe / PayPal",
          "Assistance Wise / Mercury / Payoneer",
          "Shopify + nom de domaine",
          "Autre service"
        ],
        serviceStatuses: ["Actif", "Inclus", "À renouveler", "Expiré"],
        paymentOptions: [
          ["under_review", "En vérification"],
          ["paid", "Payé"],
          ["pending", "En attente"],
          ["rejected", "Rejeté"]
        ],
        fileOptions: [
          ["pending", "En attente"],
          ["in_progress", "En cours"],
          ["completed", "Terminé"]
        ],
        stepOptions: [
          ["file_received", "Réception du dossier"],
          ["payment_review", "Vérification paiement"],
          ["llc_processing", "Création LLC"],
          ["documents_ready", "Documents disponibles"]
        ]
      }
    : {
        title: "Client portal management",
        subtitle: "Select a client file and manage only the items visible in that client portal.",
        search: "Search a file...",
        choose: "Choose a file",
        opened: "Open file",
        statusTab: "Status",
        documentsTab: "Documents",
        servicesTab: "Services",
        messagesTab: "Messages",
        statusTitle: "File status",
        payment: "Payment",
        file: "File",
        step: "Current step",
        save: "Save",
        documentsTitle: "File documents",
        docTitle: "Document name",
        upload: "Add document",
        noDocuments: "No document for this file.",
        servicesTitle: "File services",
        serviceName: "Service name",
        serviceStatus: "Service status",
        serviceValue: "Detail / value",
        expiration: "Expiration",
        renewal: "Renewal",
        addService: "Add service",
        noServices: "No service for this file.",
        messagesTitle: "File messages",
        subject: "Subject",
        message: "Message",
        reply: "Reply to client",
        noMessages: "No message for this file.",
        delete: "Delete",
        saved: "Saved.",
        loading: "Loading...",
        counts: "items",
        serviceTemplates: [
          "US phone number",
          "Registered Agent",
          "EIN",
          "Operating Agreement",
          "Stripe / PayPal assistance",
          "Wise / Mercury / Payoneer assistance",
          "Shopify + domain name",
          "Other service"
        ],
        serviceStatuses: ["Active", "Included", "Renewal due", "Expired"],
        paymentOptions: [
          ["under_review", "Under review"],
          ["paid", "Paid"],
          ["pending", "Pending"],
          ["rejected", "Rejected"]
        ],
        fileOptions: [
          ["pending", "Pending"],
          ["in_progress", "In progress"],
          ["completed", "Completed"]
        ],
        stepOptions: [
          ["file_received", "File received"],
          ["payment_review", "Payment review"],
          ["llc_processing", "LLC processing"],
          ["documents_ready", "Documents ready"]
        ]
      };

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [portal, setPortal] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<Panel>("status");

  const [payment, setPayment] = useState("under_review");
  const [file, setFile] = useState("pending");
  const [currentStep, setCurrentStep] = useState("file_received");

  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [replaceDocId, setReplaceDocId] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [serviceStatus, setServiceStatus] = useState(isFr ? "Actif" : "Active");
  const [serviceValue, setServiceValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [renewalDueAt, setRenewalDueAt] = useState("");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((client) => client.label.toLowerCase().includes(q));
  }, [clients, search]);

  async function loadClients() {
    const res = await fetch("/api/admin/client-portal/manage", { cache: "no-store" });
    const json = await res.json();

    const rows = Array.isArray(json?.clients) ? json.clients : [];
    setClients(rows);

    const first = rows.find((item: ClientRow) => item.email === email) || rows[0];

    if (first) {
      setEmail(first.email);
      setSelectedLabel(first.label);
      await loadClient(first.email);
    } else {
      await loadClient(email);
    }
  }

  async function loadClient(nextEmail = email) {
    setLoading(true);
    setNotice("");

    try {
      const res = await fetch(`/api/admin/client-portal/manage?email=${encodeURIComponent(nextEmail)}`, {
        cache: "no-store"
      });

      const json = await res.json();

      if (json?.portal) {
        setEmail(nextEmail);
        setSelectedLabel(json.label || "");
        setPortal(json.portal);
        setPayment(json.portal.status?.payment || "under_review");
        setFile(json.portal.status?.file || "pending");
        setCurrentStep(json.portal.status?.currentStep || "file_received");
      }
    } finally {
      setLoading(false);
    }
  }

  async function post(action: string, body: Record<string, any> = {}) {
    const res = await fetch("/api/admin/client-portal/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action, ...body })
    });

    const json = await res.json();

    if (json?.portal) {
      setPortal(json.portal);
      setSelectedLabel(json.label || selectedLabel);
      setNotice(t.saved);
      await loadClients();
    }
  }

  async function saveStatus() {
    await post("updateStatus", { payment, file, currentStep });
  }

  async function addService() {
    if (!serviceName.trim()) return;

    await post("addService", {
      nameFr: isFr ? serviceName : "",
      nameEn: isFr ? "" : serviceName,
      statusFr: isFr ? serviceStatus : "",
      statusEn: isFr ? "" : serviceStatus,
      value: serviceValue,
      expiresAt,
      renewalDueAt
    });

    setServiceName("");
    setServiceStatus(isFr ? "Actif" : "Active");
    setServiceValue("");
    setExpiresAt("");
    setRenewalDueAt("");
  }

  async function uploadDocument() {
    if (!docFile) return;

    const form = new FormData();
    form.append("email", email);
    form.append("title", docTitle);
    form.append("file", docFile);
    if (replaceDocId) form.append("documentId", replaceDocId);

    const res = await fetch("/api/admin/client-portal/upload-document", {
      method: "POST",
      body: form
    });

    const json = await res.json();

    if (json?.portal) {
      setPortal(json.portal);
      setNotice(t.saved);
      setDocTitle("");
      setDocFile(null);
      setReplaceDocId("");
      await loadClients();
    }
  }

  async function sendMessage() {
    if (!subject && !message) return;

    await post("sendMessage", { subject, message });

    setSubject("");
    setMessage("");
  }

  useEffect(() => {
    loadClients().catch(() => {});
  }, []);

const StatPill = ({ value }: { value: string }) => (
    <span className="rounded-full bg-[#FFF3EF] px-3 py-2 text-xs font-black text-[#F15A24]">
      {value}
    </span>
  );

  return (
    <main className="min-h-screen bg-[#F3F7FB] px-6 py-8 text-[#111827]">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[28px] border border-[#E6EDF5] bg-white p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#F15A24]">Admin</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">{t.title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-bold text-[#64748B]">{t.subtitle}</p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 rounded-[22px] border border-[#DDE7F2] bg-[#F8FAFC] p-4 md:grid-cols-[0.9fr_1.4fr]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black outline-none"
            />

            <select
              value={email}
              onChange={(e) => loadClient(e.target.value)}
              className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black outline-none"
            >
              {filteredClients.length ? (
                filteredClients.map((client) => (
                  <option key={client.email} value={client.email}>
                    {client.label}
                  </option>
                ))
              ) : (
                <option value={email}>{selectedLabel || t.choose}</option>
              )}
            </select>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#E6EDF5] bg-white p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8AA0BC]">{t.opened}</p>
              <p className="mt-2 text-xl font-black text-[#123A63]">{selectedLabel || t.choose}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatPill value={`${portal?.documents?.length || 0} ${t.documentsTab}`} />
              <StatPill value={`${portal?.services?.length || 0} ${t.servicesTab}`} />
              <StatPill value={`${portal?.messages?.length || 0} ${t.messagesTab}`} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ["status", t.statusTab],
              ["documents", t.documentsTab],
              ["services", t.servicesTab],
              ["messages", t.messagesTab]
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPanel(key as Panel)}
                className={`rounded-[14px] px-5 py-3 text-sm font-black ${
                  panel === key
                    ? "bg-[#F15A24] text-white"
                    : "border border-[#DDE7F2] bg-white text-[#123A63]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {notice ? <p className="mt-4 rounded-[14px] bg-[#ECFDF3] px-4 py-3 text-sm font-black text-[#087443]">{notice}</p> : null}
          {loading ? <p className="mt-4 text-sm font-black text-[#64748B]">{t.loading}</p> : null}
        </div>

        <div className="mt-6 rounded-[28px] border border-[#E6EDF5] bg-white p-7">
          {panel === "status" && (
            <section>
              <h2 className="text-2xl font-black tracking-[-0.04em]">{t.statusTitle}</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <select value={payment} onChange={(e) => setPayment(e.target.value)} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black">
                  {t.paymentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>

                <select value={file} onChange={(e) => setFile(e.target.value)} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black">
                  {t.fileOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>

                <select value={currentStep} onChange={(e) => setCurrentStep(e.target.value)} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black">
                  {t.stepOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              <button onClick={saveStatus} className="mt-5 rounded-[14px] bg-[#F15A24] px-6 py-3 text-sm font-black text-white">
                {t.save}
              </button>
            </section>
          )}

          {panel === "documents" && (
            <section>
              <h2 className="text-2xl font-black tracking-[-0.04em]">{t.documentsTitle}</h2>

              <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder={t.docTitle} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black outline-none" />
                <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="rounded-[14px] border border-[#DDE7F2] bg-white px-4 py-3 text-sm font-black" />
                <button onClick={uploadDocument} className="rounded-[14px] bg-[#F15A24] px-6 py-3 text-sm font-black text-white">{t.upload}</button>
              </div>

              <div className="mt-6 grid gap-3">
                {portal?.documents?.length ? portal.documents.map((doc: any) => {
                  const docUrl = doc.url || doc.fileUrl || "#";

                  return (
                    <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#DDE7F2] bg-[#F8FAFC] px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-[#123A63]">{doc.name || doc.title || doc.filename}</p>
                        <p className="mt-1 text-xs font-bold text-[#8AA0BC]">{doc.filename || "PDF"}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={docUrl}
                          target="_self"
                          rel="noreferrer"
                          title={isFr ? "Ouvrir" : "Open"}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#DDE7F2] bg-white text-[#123A63] transition hover:border-[#F15A24] hover:text-[#F15A24]"
                        ><VemoIconOpen /></a>

                        <a
                          href={docUrl}
                          download
                          title={isFr ? "Télécharger" : "Download"}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#DDE7F2] bg-white text-[#123A63] transition hover:border-[#F15A24] hover:text-[#F15A24]"
                        ><VemoIconDownload /></a>

                        <label
                          title={isFr ? "Remplacer" : "Replace"}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#DDE7F2] bg-white text-[#123A63] transition hover:border-[#F15A24] hover:text-[#F15A24]"
                        ><VemoIconReplace /><input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (!file) return;
                              setReplaceDocId(doc.id);
                              setDocTitle(doc.name || doc.title || doc.filename || "");
                              setDocFile(file);
                              setTimeout(() => uploadDocument(), 50);
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => post("deleteDocument", { id: doc.id })}
                          title={isFr ? "Supprimer" : "Delete"}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#FBD2C4] bg-white text-[#F15A24] transition hover:bg-[#FFF3EF]"
                        ><VemoIconTrash /></button>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="rounded-[16px] border border-[#DDE7F2] bg-[#F8FAFC] p-4 text-sm font-black text-[#64748B]">{t.noDocuments}</p>
                )}
              </div>
            </section>
          )}

          {panel === "services" && (
            <section>
              <h2 className="text-2xl font-black tracking-[-0.04em]">{t.servicesTitle}</h2>

              <div className="mt-6 grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <select value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black">
                    <option value="">{t.serviceName}</option>
                    {t.serviceTemplates.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>

                  <select value={serviceStatus} onChange={(e) => setServiceStatus(e.target.value)} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black">
                    {t.serviceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>

                <input value={serviceValue} onChange={(e) => setServiceValue(e.target.value)} placeholder={t.serviceValue} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black outline-none" />

                <div className="grid gap-3 md:grid-cols-3">
                  <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black outline-none" />
                  <input type="date" value={renewalDueAt} onChange={(e) => setRenewalDueAt(e.target.value)} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black outline-none" />
                  <button onClick={addService} className="rounded-[14px] bg-[#F15A24] px-6 py-3 text-sm font-black text-white">{t.addService}</button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {portal?.services?.length ? portal.services.map((item: any) => {
                  const name = isFr ? item.nameFr || "—" : item.nameEn || "—";
                  const status = isFr ? item.statusFr || "—" : item.statusEn || "—";

                  return (
                    <div key={item.id} className="rounded-[16px] border border-[#DDE7F2] bg-[#F8FAFC] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-[#123A63]">{name}</p>
                          <p className="mt-1 text-xs font-bold text-[#64748B]">{item.value || "—"}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#F15A24]">{status}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs font-black text-[#8AA0BC]">{item.expiresAt || "—"} / {item.renewalDueAt || "—"}</p>
                        <button onClick={() => post("deleteService", { id: item.id })} className="text-xs font-black text-[#F15A24]">{t.delete}</button>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="rounded-[16px] border border-[#DDE7F2] bg-[#F8FAFC] p-4 text-sm font-black text-[#64748B]">{t.noServices}</p>
                )}
              </div>
            </section>
          )}

          {panel === "messages" && (
            <section>
              <h2 className="text-2xl font-black tracking-[-0.04em]">{t.messagesTitle}</h2>

              <div className="mt-6 grid gap-3">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t.subject} className="h-12 rounded-[14px] border border-[#DDE7F2] bg-white px-4 text-sm font-black outline-none" />
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.message} className="h-28 resize-none rounded-[14px] border border-[#DDE7F2] bg-white px-4 py-4 text-sm font-black outline-none" />
                <button onClick={sendMessage} className="w-fit rounded-[14px] bg-[#F15A24] px-6 py-3 text-sm font-black text-white">{t.reply}</button>
              </div>

              <div className="mt-6 grid gap-3">
                {portal?.messages?.length ? portal.messages.map((msg: any) => (
                  <div key={msg.id} className="rounded-[16px] border border-[#DDE7F2] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8AA0BC]">{msg.from || "admin"}</p>
                    <p className="mt-2 text-sm font-black text-[#123A63]">{msg.subject || "Message"}</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{msg.message}</p>
                  </div>
                )) : (
                  <p className="rounded-[16px] border border-[#DDE7F2] bg-[#F8FAFC] p-4 text-sm font-black text-[#64748B]">{t.noMessages}</p>
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
