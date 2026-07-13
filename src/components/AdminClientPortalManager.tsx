"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import PremiumConfirmDialog from "@/components/PremiumConfirmDialog";
import PremiumToast from "@/components/PremiumToast";

type ClientAccount = {
  id: string;
  email: string;
  company_name?: string;
  plan_name?: string;
  status?: string;
  created_at?: string;
};

type ClientDocument = {
  id: string;
  title: string;
  document_key?: string;
  file_name?: string;
  file_url?: string;
  status?: string;
  admin_comment?: string;
  updated_at?: string;
};

type ClientMessage = {
  id: string;
  subject?: string;
  message: string;
  sender?: "admin" | "client" | string;
  created_at?: string;
};

type ConfirmAction = {
  type: "document" | "message";
  id: string;
  title: string;
  message: string;
};

type ToastState = {
  open: boolean;
  type: "success" | "error" | "info";
  title: string;
  message: string;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;

  return createClient(url, anon);
}
function docIcon(key?: string) {
  if (key === "ein_letter") return "EIN";
  if (key === "operating_agreement") return "OA";
  if (key === "company_document") return "LLC";
  return "DOC";
}

export default function AdminClientPortalManager() {
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);

  const [docTitle, setDocTitle] = useState("Company Document");
  const [docKey, setDocKey] = useState("company_document");
  const [docComment, setDocComment] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingDoc, setSavingDoc] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  const selectedClient = useMemo(
    () => clients.find((client) => client.email === selectedEmail) || null,
    [clients, selectedEmail]
  );

  const availableDocs = documents.filter(
    (doc) => doc.file_url || doc.status === "available"
  );

  function showToast(
    type: "success" | "error" | "info",
    title: string,
    messageText: string
  ) {
    setToast({
      open: true,
      type,
      title,
      message: messageText,
    });
  }

  async function loadClients() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/client-portal/clients");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Impossible de charger les clients.");
      }

      const loadedClients = result.clients || [];
      setClients(loadedClients);

      if (!selectedEmail && loadedClients[0]?.email) {
        setSelectedEmail(loadedClients[0].email);
      }
    } catch (err) {
      showToast(
        "error",
        "Chargement impossible",
        err instanceof Error ? err.message : "Erreur clients."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadClientDetails(email: string) {
    if (!email) return;

    try {
      const [documentsResponse, messagesResponse] = await Promise.all([
        fetch(`/api/admin/client-portal/documents?email=${encodeURIComponent(email)}`),
        fetch(`/api/admin/client-portal/messages?email=${encodeURIComponent(email)}`),
      ]);

      const documentsResult = await documentsResponse.json();
      const messagesResult = await messagesResponse.json();

      if (!documentsResponse.ok) {
        throw new Error(documentsResult.error || "Impossible de charger les documents.");
      }

      if (!messagesResponse.ok) {
        throw new Error(messagesResult.error || "Impossible de charger les messages.");
      }

      setDocuments(documentsResult.documents || []);
      setMessages(messagesResult.messages || []);
    } catch (err) {
      showToast(
        "error",
        "Détails client indisponibles",
        err instanceof Error ? err.message : "Erreur détails client."
      );
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmail || !docFile) {
      showToast(
        "error",
        "Fichier manquant",
        "Sélectionne un client et ajoute un fichier avant de publier."
      );
      return;
    }

    setSavingDoc(true);

    try {
      const formData = new FormData();

      formData.append("email", selectedEmail);
      formData.append("title", docTitle);
      formData.append("documentKey", docKey);
      formData.append("comment", docComment);
      formData.append("file", docFile);

      const response = await fetch("/api/admin/client-portal/documents", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload impossible.");
      }

      showToast(
        "success",
        "Document publié",
        "Le document est maintenant disponible dans l’espace client."
      );

      setDocFile(null);
      setDocComment("");

      const fileInput = document.getElementById("admin-doc-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      await loadClientDetails(selectedEmail);
    } catch (err) {
      showToast(
        "error",
        "Publication impossible",
        err instanceof Error ? err.message : "Erreur upload."
      );
    } finally {
      setSavingDoc(false);
    }
  }

  function askDeleteDocument(documentId: string) {
    if (!documentId) return;

    setConfirmAction({
      type: "document",
      id: documentId,
      title: "Supprimer le document ?",
      message:
        "Ce document sera retiré de l’espace client et ne sera plus téléchargeable. Cette action est définitive.",
    });
  }

  async function deleteDocument(documentId: string) {
    if (!documentId) return;

    setConfirmLoading(true);

    try {
      const response = await fetch("/api/admin/client-portal/documents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: documentId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Suppression impossible.");
      }

      setConfirmAction(null);

      showToast(
        "success",
        "Document supprimé",
        "Le document a été retiré de l’espace client."
      );

      await loadClientDetails(selectedEmail);
    } catch (err) {
      showToast(
        "error",
        "Suppression impossible",
        err instanceof Error ? err.message : "Erreur suppression document."
      );
    } finally {
      setConfirmLoading(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEmail || !message.trim()) {
      showToast(
        "error",
        "Message incomplet",
        "Sélectionne un client et écris un message avant l’envoi."
      );
      return;
    }

    setSendingMessage(true);

    try {
      const response = await fetch("/api/admin/client-portal/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedEmail,
          subject: subject || "Message Vemo",
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Envoi impossible.");
      }

      showToast(
        "success",
        "Message envoyé",
        "Le message apparaît maintenant dans Vemo Messenger."
      );

      setSubject("");
      setMessage("");
      await loadClientDetails(selectedEmail);
    } catch (err) {
      showToast(
        "error",
        "Envoi impossible",
        err instanceof Error ? err.message : "Erreur message."
      );
    } finally {
      setSendingMessage(false);
    }
  }

  function askDeleteMessage(messageId: string) {
    if (!messageId) return;

    setConfirmAction({
      type: "message",
      id: messageId,
      title: "Supprimer le message ?",
      message:
        "Ce message sera supprimé de la conversation Messenger du client. Cette action est définitive.",
    });
  }

  async function deleteMessage(messageId: string) {
    if (!messageId) return;

    setConfirmLoading(true);

    try {
      const response = await fetch("/api/admin/client-portal/messages", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: messageId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Suppression impossible.");
      }

      setConfirmAction(null);

      showToast(
        "success",
        "Message supprimé",
        "Le message a été supprimé de la conversation."
      );

      await loadClientDetails(selectedEmail);
    } catch (err) {
      showToast(
        "error",
        "Suppression impossible",
        err instanceof Error ? err.message : "Erreur suppression."
      );
    } finally {
      setConfirmLoading(false);
    }
  }

  async function logoutAdmin() {
    const supabase = getSupabaseBrowser();

    await supabase?.auth.signOut();

    window.location.href = "/fr/admin/connexion";
  }
  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedEmail) {
      loadClientDetails(selectedEmail);
    }
  }, [selectedEmail]);

  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F15A24] text-xl font-black text-white  -orange-900/20">
              V
            </span>
            <span>
              <span className="block text-2xl font-black tracking-[-0.05em]">
                Vemo Admin
              </span>
              <span className="block text-xs font-bold text-slate-500">
                Documents, clients & messenger
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadClients}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black  transition hover:border-[#F15A24] hover:text-[#F15A24]"
            >
              Actualiser
            </button>

            <button
              type="button"
              onClick={logoutAdmin}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950  transition hover:border-[#F15A24] hover:text-[#F15A24]"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8 rounded-[2rem] border border-slate-100 bg-white p-7  -slate-200/70">
          <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F15A24]">
                Administration
              </p>
              <h1 className="mt-3 text-5xl font-black tracking-[-0.07em] md:text-6xl">
                Portails clients
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-500">
                Gérez les documents, les échanges Messenger et le suivi client depuis un seul espace.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Client actif
              </span>
              <select
                value={selectedEmail}
                onChange={(event) => setSelectedEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.email}>
                    {client.company_name || "Client LLC"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {loading && (
          <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-black text-slate-500  -slate-200/70">
            Chargement des clients...
          </div>
        )}

        {!loading && clients.length === 0 && (
          <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-black text-slate-500  -slate-200/70">
            Aucun client trouvé. Crée d’abord un compte client ou finalise un paiement.
          </div>
        )}

        {!loading && selectedClient && (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white  -slate-200/70">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="p-8">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-[#F15A24]">
                    Client sélectionné
                  </p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.07em]">
                    {selectedClient.company_name || "Client LLC"}
                  </h2>
                </div>

                <div className="grid gap-4 bg-slate-50 p-8 sm:grid-cols-3">
                  <MetricCard label="Pack" value={selectedClient.plan_name || "LLC Package"} />
                  <MetricCard label="Statut" value={selectedClient.status || "active"} />
                  <MetricCard label="Docs" value={String(availableDocs.length)} />
                </div>
              </div>
            </section>

            <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-8">
                <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white  -slate-200/70">
                  <div className="bg-[#F15A24] hover:bg-[#D94A1B] p-7 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                      Document studio
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                      Publier un document
                    </h2>
                    <p className="mt-3 text-sm font-bold text-white/70">
                      Le document sera disponible instantanément côté client. Si le même type existe déjà, il sera remplacé.
                    </p>
                  </div>

                  <form onSubmit={uploadDocument} className="grid gap-5 p-7 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-slate-700">
                        Type
                      </span>
                      <select
                        value={docKey}
                        onChange={(event) => {
                          const value = event.target.value;
                          setDocKey(value);

                          if (value === "company_document") setDocTitle("Company Document");
                          if (value === "operating_agreement") setDocTitle("EIN application");
                          if (value === "ein_letter") setDocTitle("EIN Letter");
                          if (value === "other") setDocTitle("Document");
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                      >
                        <option value="company_document">Company Document</option>
                        <option value="operating_agreement">EIN application</option>
                        <option value="ein_letter">EIN Letter</option>
                        <option value="other">Autre document</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-slate-700">
                        Titre client
                      </span>
                      <input
                        value={docTitle}
                        onChange={(event) => setDocTitle(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-black text-slate-700">
                        Note visible
                      </span>
                      <input
                        value={docComment}
                        onChange={(event) => setDocComment(event.target.value)}
                        placeholder="Ex : Document officiel ajouté par Vemo."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-black text-slate-700">
                        Fichier
                      </span>
                      <input
                        id="admin-doc-file"
                        type="file"
                        onChange={(event) => setDocFile(event.target.files?.[0] || null)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={savingDoc}
                      className="w-fit rounded-2xl bg-[#F15A24] px-7 py-4 text-sm font-black text-white  -orange-900/20 transition hover:bg-[#D94A1B] disabled:opacity-60"
                    >
                      {savingDoc ? "Publication..." : "Publier"}
                    </button>
                  </form>
                </section>

                <section className="rounded-[2rem] border border-slate-100 bg-white p-7  -slate-200/70">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
                        Documents
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                        Documents publiés
                      </h2>
                    </div>

                    <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#F15A24]">
                      {documents.length}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {documents.length === 0 && (
                      <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                        Aucun document.
                      </p>
                    )}

                    {documents.map((doc) => {
                      const available = Boolean(doc.file_url) || doc.status === "available";

                      return (
                        <article
                          key={doc.id}
                          className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F15A24] text-xs font-black text-white">
                                {docIcon(doc.document_key)}
                              </span>

                              <div>
                                <p className="font-black">{doc.title}</p>
                                <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                  {doc.document_key || "document"}
                                </p>
                              </div>
                            </div>

                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-black",
                                available
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              )}
                            >
                              {available ? "available" : "pending"}
                            </span>
                          </div>

                          <p className="mt-4 text-sm font-bold leading-6 text-slate-500">
                            {doc.admin_comment || doc.file_name || "-"}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                className="inline-flex rounded-xl bg-[#F15A24] px-4 py-2 text-xs font-black text-white"
                              >
                                Ouvrir
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => askDeleteDocument(doc.id)}
                              className="inline-flex rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                            >
                              Supprimer
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section className="rounded-[2rem] border border-slate-100 bg-white p-7  -slate-200/70">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
                      Message rapide
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                      Envoyer un message
                    </h2>
                  </div>

                  <form onSubmit={sendMessage} className="mt-6 space-y-5">
                    <input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Sujet"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                    />

                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Message visible dans l’espace client..."
                      className="min-h-[160px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black outline-none transition focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                    />

                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="w-fit rounded-2xl bg-[#F15A24] px-7 py-4 text-sm font-black text-white  -orange-900/20 transition hover:bg-[#D94A1B] disabled:opacity-60"
                    >
                      {sendingMessage ? "Envoi..." : "Envoyer"}
                    </button>
                  </form>
                </section>

                <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white  -slate-200/70">
                  <div className="bg-[#F15A24] hover:bg-[#D94A1B] p-7 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                          Vemo Messenger
                        </p>
                        <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                          Conversation
                        </h2>
                      </div>

                      <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">
                        {messages.length}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-[620px] space-y-4 overflow-y-auto bg-slate-50 p-5">
                    {messages.length === 0 && (
                      <p className="rounded-2xl bg-white p-5 text-sm font-bold text-slate-500">
                        Aucun message.
                      </p>
                    )}

                    {messages.map((msg) => {
                      const isClient = msg.sender === "client";

                      return (
                        <div
                          key={msg.id}
                          className={cn("flex", isClient ? "justify-start" : "justify-end")}
                        >
                          <div
                            className={cn(
                              "max-w-[90%] rounded-[1.5rem] p-5 ",
                              isClient
                                ? "rounded-tl-md border border-slate-100 bg-white text-slate-950"
                                : "rounded-tr-md bg-[#F15A24] text-white"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-black">
                                  {isClient ? "Client" : "Vemo Admin"}
                                </p>
                                {msg.created_at && (
                                  <p
                                    className={cn(
                                      "mt-1 text-[11px] font-black uppercase tracking-[0.12em]",
                                      isClient ? "text-slate-400" : "text-white/60"
                                    )}
                                  >
                                    {formatDate(msg.created_at)}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => askDeleteMessage(msg.id)}
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-black transition",
                                  isClient
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-white/15 text-white hover:bg-white/25"
                                )}
                              >
                                Supprimer
                              </button>
                            </div>

                            {!isClient && msg.subject && (
                              <p className="mt-4 text-sm font-black">{msg.subject}</p>
                            )}

                            <p
                              className={cn(
                                "mt-3 whitespace-pre-line text-sm font-bold leading-7",
                                isClient ? "text-slate-600" : "text-white/90"
                              )}
                            >
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </section>
          </div>
        )}
      </section>

      <PremiumToast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() =>
          setToast((current) => ({
            ...current,
            open: false,
          }))
        }
      />

      <PremiumConfirmDialog
        open={Boolean(confirmAction)}
        eyebrow="Action admin"
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        tone="danger"
        loading={confirmLoading}
        onCancel={() => {
          if (!confirmLoading) setConfirmAction(null);
        }}
        onConfirm={() => {
          if (!confirmAction) return;

          if (confirmAction.type === "document") {
            deleteDocument(confirmAction.id);
            return;
          }

          deleteMessage(confirmAction.id);
        }}
      />
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5  ring-1 ring-slate-100">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F15A24]">
        {label}
      </p>
      <p className="mt-2 truncate text-lg font-black">{value || "-"}</p>
    </div>
  );
}
