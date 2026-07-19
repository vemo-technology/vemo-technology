"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";


type ClientDoc = {
  id: string;
  title?: string;
  name?: string;
  filename?: string;
  url?: string;
  public_url?: string;
  created_at?: string;
};

type ClientMessage = {
  id: string;
  subject?: string;
  message?: string;
  content?: string;
  sender?: string;
  created_at?: string;
};

export default function AdminClientContent() {
  const params = useSearchParams();

  const email = useMemo(
    () => String(params.get("email") || "").trim().toLowerCase(),
    [params]
  );

  const [documents, setDocuments] = useState<ClientDoc[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingDoc, setSavingDoc] = useState(false);
  const [replacingDocId, setReplacingDocId] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [notice, setNotice] = useState("");
  const [clientStatus, setClientStatus] = useState<any>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const loadClientData = useCallback(async () => {
    if (!email) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [docsRes, msgRes, statusRes] = await Promise.all([
      fetch(`/api/admin/client-portal/documents?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
      }),
      fetch(`/api/admin/client-portal/messages?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
      }),
      fetch(`/api/admin/client-portal/status?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
      }),
    ]);

    const docsData = await docsRes.json().catch(() => null);
    const msgData = await msgRes.json().catch(() => null);
    const statusData = await statusRes.json().catch(() => null);

    setDocuments(Array.isArray(docsData?.documents) ? docsData.documents : []);
    setMessages(Array.isArray(msgData?.messages) ? msgData.messages : []);
    setClientStatus(statusData?.status || null);
    setLoading(false);
  }, [email]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);
async function saveClientStatus(next: any) {
    setNotice("");

    if (!email) {
      setNotice("Email client introuvable.");
      return;
    }

    const merged = {
      ...(clientStatus || {}),
      ...next,
      email,
      client_email: email,
    };

    setClientStatus(merged);
    setSavingStatus(true);

    try {
      const res = await fetch("/api/admin/client-portal/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(merged),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        setNotice(data?.error || "Erreur sauvegarde statut.");
        return;
      }

      setClientStatus(data.status);
      setNotice("Statut dossier mis à jour.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function uploadDocument() {
    setNotice("");

    if (!email) {
      setNotice("Email client introuvable.");
      return;
    }

    if (!uploadFile) {
      setNotice("Choisis un fichier.");
      return;
    }

    setSavingDoc(true);

    try {
      const form = new FormData();
      form.append("email", email);
      form.append("client_email", email);
      form.append("title", uploadTitle || uploadFile.name);
      form.append("file", uploadFile);

      const res = await fetch("/api/admin/client-portal/documents", {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        setNotice(data?.error || "Erreur upload document.");
        return;
      }

      setUploadFile(null);
      setUploadTitle("");
      setNotice("Document ajouté à l’espace client.");
      await loadClientData();
    } catch (e: any) {
      setNotice(e?.message || "Erreur upload document.");
    } finally {
      setSavingDoc(false);
    }
  }

  async function replaceDocument(docId: string, file: File) {
    setNotice("");
    setReplacingDocId(docId);

    try {
      const form = new FormData();
      form.append("email", email);
      form.append("client_email", email);
      form.append("replace_id", docId);
      form.append("title", file.name);
      form.append("file", file);

      const res = await fetch("/api/admin/client-portal/documents", {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        setNotice(data?.error || "Erreur remplacement document.");
        return;
      }

      setNotice("Document remplacé.");
      await loadClientData();
    } finally {
      setReplacingDocId("");
    }
  }

  async function deleteDocument(docId: string) {
    const confirmed = window.confirm("Supprimer ce document ?");
    if (!confirmed) return;

    const res = await fetch("/api/admin/client-portal/documents", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: docId }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.ok === false) {
      setNotice(data?.error || "Erreur suppression document.");
      return;
    }

    setNotice("Document supprimé.");
    await loadClientData();
  }

  async function sendMessage() {
    setNotice("");

    if (!email) {
      setNotice("Email client introuvable.");
      return;
    }

    if (!messageContent.trim()) {
      setNotice("Écris un message.");
      return;
    }

    setSendingMessage(true);

    try {
      const res = await fetch("/api/admin/client-portal/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          client_email: email,
          subject: messageSubject || "Message VEMO",
          message: messageContent,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        setNotice(data?.error || "Erreur envoi message.");
        return;
      }

      setMessageSubject("");
      setMessageContent("");
      setNotice("Message envoyé.");
      await loadClientData();
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#111827]">
      <section className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="rounded-[2rem] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <a href="/fr/admin" className="text-sm font-black text-[#F15A24]">
                ← Retour admin
              </a>

              <h1 className="mt-4 text-[34px] font-black tracking-[-0.06em]">
                Fiche client
              </h1>

              <p className="mt-1 text-sm font-bold text-slate-500">
                {email || "Aucun email client"}
              </p>
            </div>

            <a
              href={`/fr/espace-client?email=${encodeURIComponent(email)}`}
              target="_self"
              className="inline-flex h-[46px] items-center justify-center rounded-[15px] border border-[#E6EDF5] bg-white px-5 text-sm font-black text-[#123A63] transition hover:border-[#F15A24]"
            >
              Voir espace client
            </a>
          </div>

          {notice ? (
            <div className="mt-5 rounded-[16px] border border-[#E6EDF5] bg-[#F8FAFC] px-4 py-3 text-sm font-black text-[#123A63]">
              {notice}
            </div>
          ) : null}
        </div>

        
        <section className="mt-6 rounded-[2rem] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Suivi dossier
              </p>
              <h2 className="mt-2 text-[25px] font-black tracking-[-0.05em]">
                Statuts visibles client
              </h2>
            </div>

            <span className="rounded-full bg-[#F15A24] px-3 py-1 text-xs font-black text-white">
              {savingStatus ? "..." : "LIVE"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Paiement
              </label>
              <select
                value={clientStatus?.payment_status || "En vérification"}
                onChange={(e) => saveClientStatus({ payment_status: e.target.value })}
                className="h-[52px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-black text-[#123A63] outline-none focus:border-[#F15A24]"
              >
                <option>En vérification</option>
                <option>Payé</option>
                <option>Refusé</option>
                <option>Remboursé</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Dossier
              </label>
              <select
                value={clientStatus?.dossier_status || "En attente"}
                onChange={(e) => saveClientStatus({ dossier_status: e.target.value })}
                className="h-[52px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-black text-[#123A63] outline-none focus:border-[#F15A24]"
              >
                <option>En attente</option>
                <option>En traitement</option>
                <option>Documents demandés</option>
                <option>Terminé</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Étape actuelle
              </label>
              <select
                value={clientStatus?.current_step || "Réception du dossier"}
                onChange={(e) => saveClientStatus({ current_step: e.target.value })}
                className="h-[52px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-black text-[#123A63] outline-none focus:border-[#F15A24]"
              >
                <option>Réception du dossier</option>
                <option>Vérification des informations</option>
                <option>Dépôt auprès de l’État</option>
                <option>Documents de formation prêts</option>
                <option>EIN en cours</option>
                <option>Dossier finalisé</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Note client
              </label>
              <input
                value={clientStatus?.note || ""}
                onChange={(e) => setClientStatus({ ...(clientStatus || {}), note: e.target.value })}
                onBlur={(e) => saveClientStatus({ note: e.target.value })}
                placeholder="Note visible client"
                className="h-[52px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
              />
            </div>
          </div>
        </section>

<div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Documents
                </p>
                <h2 className="mt-2 text-[25px] font-black tracking-[-0.05em]">
                  Documents visibles client
                </h2>
              </div>

              <span className="rounded-full bg-[#F15A24] px-3 py-1 text-xs font-black text-white">
                {documents.length}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Titre : Articles of Organization, EIN, Operating Agreement..."
                className="h-[52px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
              />

              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="h-[52px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 py-3 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
              />

              <button
                type="button"
                onClick={uploadDocument}
                disabled={savingDoc}
                className="h-[52px] w-full rounded-[16px] bg-[#F15A24] text-sm font-black text-white transition hover:bg-[#DB4F1C] disabled:opacity-60"
              >
                {savingDoc ? "Upload..." : "Uploader document"}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="rounded-[16px] border border-[#E6EDF5] bg-[#F8FAFC] p-4 text-sm font-bold text-slate-500">
                  Chargement...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-[16px] border border-[#E6EDF5] bg-[#F8FAFC] p-4 text-sm font-bold text-slate-500">
                  Aucun document pour ce client.
                </div>
              ) : (
                documents.map((doc, index) => {
                  const url = doc.public_url || doc.url || "";
                  const title = doc.title || doc.name || doc.filename || `Document ${index + 1}`;

                  return (
                    <div
                      key={doc.id || `${title}-${index}`}
                      className="rounded-[16px] border border-[#E6EDF5] bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-[#123A63]">{title}</p>
                          <p className="mt-1 text-xs font-bold text-slate-400">
                            {doc.filename || "Document client"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-400">
                            {doc.created_at
                              ? new Date(doc.created_at).toLocaleString("fr-FR")
                              : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {url ? (
                            <a
                              href={url}
                              target="_self"
                              rel="noreferrer"
                              title="Ouvrir"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F15A24] text-white transition hover:bg-[#DB4F1C]"
                            >
                              ↗
                            </a>
                          ) : null}

                          <label
                            title="Remplacer"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] border border-[#E6EDF5] bg-white text-[#123A63] transition hover:border-[#F15A24] hover:text-[#F15A24]"
                          >
                            <span className="text-[13px] leading-none">{replacingDocId === doc.id ? "…" : "↻"}</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && doc.id) replaceDocument(doc.id, file);
                                e.currentTarget.value = "";
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => deleteDocument(doc.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#FAD7CC] bg-[#FFF7F4] text-[#F15A24] transition hover:bg-[#F15A24] hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Messages
                </p>
                <h2 className="mt-2 text-[25px] font-black tracking-[-0.05em]">
                  Communication client
                </h2>
              </div>

              <span className="rounded-full bg-[#F15A24] px-3 py-1 text-xs font-black text-white">
                {messages.length}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Objet du message"
                className="h-[52px] w-full rounded-[16px] border border-[#E6EDF5] bg-white px-4 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
              />

              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Message destiné au client..."
                rows={6}
                className="w-full resize-none rounded-[16px] border border-[#E6EDF5] bg-white px-4 py-4 text-sm font-bold text-[#123A63] outline-none focus:border-[#F15A24]"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={sendingMessage}
                className="h-[52px] w-full rounded-[16px] bg-[#F15A24] text-sm font-black text-white transition hover:bg-[#DB4F1C] disabled:opacity-60"
              >
                {sendingMessage ? "Envoi..." : "Envoyer message"}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {messages.length === 0 ? (
                <div className="rounded-[16px] border border-[#E6EDF5] bg-[#F8FAFC] p-4 text-sm font-bold text-slate-500">
                  Aucun message pour ce client.
                </div>
              ) : (
                messages.map((item) => (
                  <div key={item.id} className="rounded-[16px] border border-[#E6EDF5] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#123A63]">
                        {item.subject || "Message VEMO"}
                      </p>

                      <span className={item.sender === "client" ? "rounded-full bg-[#F15A24] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white" : "rounded-full bg-[#EEF3F8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#123A63]"}>
                        {item.sender === "client" ? "Client" : "Admin"}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-600">
                      {item.message || item.content || ""}
                    </p>
                    <p className="mt-3 text-xs font-bold text-slate-400">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("fr-FR")
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
