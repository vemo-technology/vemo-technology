"use client";

import { useEffect, useMemo, useState } from "react";

type DocumentRow = {
  id?: string;
  title?: string;
  file_name?: string;
  document_type?: string;
  file_url?: string;
  created_at?: string;
};

type MessageRow = {
  id?: string;
  sender?: string;
  message?: string;
  created_at?: string;
};

type ClientInfo = {
  id?: string;
  email?: string;
  client_email?: string;
  dossier_number?: string;
  llc_name?: string;
  name?: string;
  full_name?: string;
  client_name?: string;
  phone?: string;
  state?: string;
  llc_state?: string;
  jurisdiction?: string;
  payment_status?: string;
  dossier_status?: string;
  status?: string;
  created_at?: string;
};

const docTypes = [
  "Company Document",
  "EIN",
  "EIN application",
  "Reçu de paiement",
  "Certificat Registered Agent",
  "Banking",
  "Autre document",
];

const paymentOptions = [
  { value: "pending_verification", label: "En attente de vérification" },
  { value: "paid", label: "Paiement confirmé" },
  { value: "unpaid", label: "Non payé" },
  { value: "rejected", label: "Paiement rejeté" },
];

const dossierOptions = [
  { value: "new", label: "Nouveau dossier" },
  { value: "in_progress", label: "En cours" },
  { value: "waiting_client", label: "En attente client" },
  { value: "documents_received", label: "Documents reçus" },
  { value: "completed", label: "Terminé" },
  { value: "suspended", label: "Suspendu" },
];

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
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function paymentLabel(value?: string) {
  const raw = cleanStatus(value).toLowerCase();

  if (!raw) return "Non défini";
  if (raw.includes("paid") || raw.includes("confirmed") || raw.includes("payé")) return "Paiement confirmé";
  if (raw.includes("unpaid")) return "Non payé";
  if (raw.includes("pending") || raw.includes("attente") || raw.includes("verification")) return "En attente de vérification";
  if (raw.includes("reject") || raw.includes("rejet") || raw.includes("refus")) return "Paiement rejeté";

  return cleanStatus(value);
}

function dossierLabel(value?: string) {
  const raw = cleanStatus(value).toLowerCase();

  if (!raw) return "Non défini";
  if (raw.includes("new")) return "Nouveau dossier";
  if (raw.includes("in progress") || raw.includes("progress") || raw.includes("cours")) return "En cours";
  if (raw.includes("waiting client") || raw.includes("attente client")) return "En attente client";
  if (raw.includes("documents received")) return "Documents reçus";
  if (raw.includes("completed") || raw.includes("done") || raw.includes("termine") || raw.includes("terminé")) return "Terminé";
  if (raw.includes("suspended")) return "Suspendu";
  if (raw.includes("payment confirmed") || raw.includes("confirmed")) return "Paiement confirmé";
  if (raw.includes("pending") || raw.includes("attente")) return "En attente";

  return cleanStatus(value);
}

function statusBadge(value: string, type: "payment" | "dossier") {
  const label = type === "payment" ? paymentLabel(value) : dossierLabel(value);
  const raw = cleanStatus(value).toLowerCase();

  const cls =
    raw.includes("paid") || raw.includes("confirmed") || raw.includes("completed") || raw.includes("done")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : raw.includes("pending") || raw.includes("waiting") || raw.includes("progress") || raw.includes("unpaid")
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : raw.includes("reject") || raw.includes("suspended") || raw.includes("refus")
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${cls}`}>
      {label}
    </span>
  );
}

function clientEmail(client?: ClientInfo) {
  return client?.email || client?.client_email || "";
}

function clientName(client?: ClientInfo) {
  return client?.full_name || client?.client_name || client?.name || "—";
}

function llcName(client?: ClientInfo) {
  return client?.llc_name || "—";
}

function clientPhone(client?: ClientInfo) {
  return client?.phone || "—";
}

function llcState(client?: ClientInfo) {
  return client?.llc_state || client?.state || client?.jurisdiction || "—";
}

function dossierNumber(client?: ClientInfo) {
  return client?.dossier_number || "—";
}

function adminDocumentActionUrl(doc: DocumentRow, mode: "view" | "download" = "view") {
  if (!doc.id) return doc.file_url || "#";
  return `/api/client-portal/documents/file?id=${encodeURIComponent(doc.id)}&mode=${mode}`;
}

function ActionIcon({ type }: { type: "open" | "replace" | "delete" }) {
  if (type === "open") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 5h5v5M10 14L19 5M19 14v4.5A1.5 1.5 0 0 1 17.5 20h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "replace") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-[#123A63]">
        {value || "—"}
      </p>
    </div>
  );
}

export default function VemoAdminClientClean() {
  const [email, setEmail] = useState("");
  const [client, setClient] = useState<ClientInfo | undefined>();
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [docType, setDocType] = useState(docTypes[0]);
  const [replaceId, setReplaceId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending_verification");
  const [dossierStatus, setDossierStatus] = useState("in_progress");

  const currentPaymentLabel = useMemo(() => paymentLabel(paymentStatus), [paymentStatus]);
  const currentDossierLabel = useMemo(() => dossierLabel(dossierStatus), [dossierStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentEmail = params.get("email") || "";

    setEmail(currentEmail);

    if (currentEmail) {
      loadClient(currentEmail);
      loadDocs(currentEmail);
      loadMessages(currentEmail);
    }
  }, []);

  function ok(msg: string) {
    setError("");
    setNotice(msg);
    setTimeout(() => setNotice(""), 4500);
  }

  function ko(msg: string) {
    setNotice("");
    setError(msg);
    setTimeout(() => setError(""), 6500);
  }

  async function loadClient(currentEmail = email) {
    if (!currentEmail) return;

    try {
      const res = await fetch("/api/admin/clients", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      const rows = Array.isArray(data?.clients) ? data.clients : [];

      const found = rows.find((item: ClientInfo) => clientEmail(item).toLowerCase() === currentEmail.toLowerCase());

      if (found) {
        setClient(found);
        setPaymentStatus(found.payment_status || found.status || "pending_verification");
        setDossierStatus(found.dossier_status || found.status || "in_progress");
      } else {
        setClient({
          email: currentEmail,
          client_email: currentEmail,
          llc_name: "—",
          dossier_number: "—",
        });
      }
    } catch {
      setClient({
        email: currentEmail,
        client_email: currentEmail,
      });
    }
  }

  async function loadDocs(currentEmail = email) {
    if (!currentEmail) return;

    try {
      const res = await fetch(`/api/admin/documents?email=${encodeURIComponent(currentEmail)}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error || data?.ok === false) {
        setDocs([]);
        if (data?.error) ko(data.error);
        return;
      }

      setDocs(data?.documents || []);
    } catch {
      setDocs([]);
      ko("Impossible de charger les documents.");
    }
  }

  async function loadMessages(currentEmail = email) {
    if (!currentEmail) return;

    try {
      const res = await fetch(`/api/admin/messages?email=${encodeURIComponent(currentEmail)}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error || data?.ok === false) {
        setMessages([]);
        return;
      }

      setMessages(data?.messages || []);
    } catch {
      setMessages([]);
    }
  }

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formElement = e.currentTarget;

    if (!email) {
      ko("Email client manquant.");
      return;
    }

    const form = new FormData(formElement);
    const file = form.get("file");

    if (!(file instanceof File) || !file.name) {
      ko("Sélectionne un fichier.");
      return;
    }

    form.set("email", email);
    form.set("document_type", docType);
    form.set("replace_id", replaceId);

    setBusy(true);

    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error || data?.ok === false) {
        ko(data?.error || "Erreur pendant l’upload.");
        return;
      }

      formElement.reset();
      setReplaceId("");
      await loadDocs();
      await loadMessages();
      ok(replaceId ? "Document remplacé avec succès." : "Document uploadé avec succès.");
    } catch (err: any) {
      ko(`Erreur réseau pendant l’upload : ${err?.message || "requête interrompue"}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDoc(id?: string) {
    if (!id) return;

    const confirmed = window.confirm("Supprimer ce document ?");
    if (!confirmed) return;

    setBusy(true);

    try {
      const res = await fetch("/api/admin/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error || data?.ok === false) {
        ko(data?.error || "Erreur suppression document.");
        return;
      }

      await loadDocs();
      await loadMessages();
      ok("Document supprimé.");
    } catch {
      ko("Erreur réseau pendant la suppression.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    const text = message.trim();

    if (!email) {
      ko("Email client manquant.");
      return;
    }

    if (!text) {
      ko("Message vide.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error || data?.ok === false) {
        ko(data?.error || "Erreur envoi message.");
        return;
      }

      setMessage("");
      await loadMessages();
      ok("Message envoyé au client.");
    } catch {
      ko("Erreur réseau pendant l’envoi.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatuses(nextPayment = paymentStatus, nextDossier = dossierStatus) {
    if (!email) {
      ko("Email client manquant.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/admin/dossier-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          payment_status: nextPayment,
          dossier_status: nextDossier,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error || data?.ok === false) {
        ko(data?.error || "Erreur mise à jour des statuts.");
        return;
      }

      await loadClient();
      await loadMessages();
      ok("Statuts mis à jour avec succès.");
    } catch {
      ko("Erreur réseau pendant la mise à jour des statuts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7FAFC] text-[#111827]">
      <header className="border-b border-[#E8E2DC] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-[28px] font-black tracking-[-0.06em] text-[#123A63]">
              VEMO <span className="text-[#F15A24]">TECH</span>
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">
              DOSSIER CLIENT
            </div>
          </div>

          <a
            href="/fr/admin"
            className="rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-3 text-sm font-black text-[#123A63] transition hover:bg-[#FFF7F2] hover:text-[#F15A24]"
          >
            ← Retour admin
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[2.5rem] border border-[#E8E2DC] bg-white p-8 -[0_24px_70px_rgba(18,58,99,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F15A24]">
                Fiche client
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.06em]">
                {llcName(client) !== "—" ? llcName(client) : "Gestion premium du dossier"}
              </h1>
              <p className="mt-3 text-sm font-bold text-slate-500">
                Dossier {dossierNumber(client)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Paiement
                </p>
                <div className="mt-2">{statusBadge(paymentStatus, "payment")}</div>
              </div>
              <div className="rounded-[1.4rem] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Dossier
                </p>
                <div className="mt-2">{statusBadge(dossierStatus, "dossier")}</div>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Nom complet" value={clientName(client)} />
            <InfoCard label="Nom LLC" value={llcName(client)} />
            <InfoCard label="État LLC" value={llcState(client)} />
            <InfoCard label="N° dossier" value={dossierNumber(client)} />
            <InfoCard label="Téléphone" value={clientPhone(client)} />
            <InfoCard label="Email" value={clientEmail(client) || email || "—"} />
            <InfoCard label="Date création" value={fmtDate(client?.created_at)} />
            <InfoCard label="Statut actuel" value={`${currentPaymentLabel} / ${currentDossierLabel}`} />
          </div>
        </div>

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

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2.2rem] border border-[#E8E2DC] bg-white p-7 -[0_18px_45px_rgba(18,58,99,0.06)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F15A24]">Documents</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">Documents du dossier</h2>

            <form onSubmit={upload} className="mt-6 rounded-[1.8rem] border border-[#E8E2DC] bg-[#FBFCFD] p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#123A63]">Type de document</span>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-[16px] border border-[#E8E2DC] bg-white px-4 py-4 text-sm font-black outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                  >
                    {docTypes.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#123A63]">Remplacer un document</span>
                  <select
                    value={replaceId}
                    onChange={(e) => setReplaceId(e.target.value)}
                    className="w-full rounded-[16px] border border-[#E8E2DC] bg-white px-4 py-4 text-sm font-black outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
                  >
                    <option value="">Ajouter nouveau document</option>
                    {docs.map((d, i) => (
                      <option key={d.id || i} value={d.id || ""}>
                        {d.title || d.file_name || d.document_type || "Document"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
                <input
                  name="file"
                  type="file"
                  className="w-full rounded-[16px] border border-dashed border-[#E8E2DC] bg-white px-4 py-4 text-sm font-black text-[#123A63] file:mr-4 file:rounded-[12px] file:border-0 file:bg-[#FFF7F2] file:px-4 file:py-2 file:text-xs file:font-black file:text-[#F15A24]"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-[16px] bg-[#F15A24] px-5 py-4 text-sm font-black text-white -[0_14px_28px_rgba(241,90,36,.20)] transition hover:bg-[#D94A1B] disabled:opacity-60"
                >
                  {busy ? "Traitement..." : replaceId ? "Remplacer" : "Uploader"}
                </button>
              </div>
            </form>

            <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-[#E8E2DC]">
              <div className="grid grid-cols-[1.1fr_1fr_110px_150px] bg-[#FBFCFD] px-5 py-4 text-xs font-black uppercase tracking-[0.13em] text-slate-500">
                <div>Document</div>
                <div>Type</div>
                <div>Date</div>
                <div className="text-right">Actions</div>
              </div>

              <div className="divide-y divide-[#E8E2DC] bg-white">
                {docs.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm font-black text-slate-500">Aucun document uploadé.</div>
                ) : (
                  docs.map((doc, i) => (
                    <div key={doc.id || i} className="grid grid-cols-[1.1fr_1fr_110px_150px] items-center px-5 py-4">
                      <div className="truncate text-sm font-black">{doc.title || doc.file_name || "Document"}</div>
                      <div className="truncate text-xs font-black text-[#123A63]">{doc.document_type || "—"}</div>
                      <div className="text-xs font-black text-slate-500">{fmtDate(doc.created_at)}</div>
                      <div className="flex justify-end gap-2">
                        <a
                          href={adminDocumentActionUrl(doc, "view")}
                          target="_self"
                          title="Ouvrir"
                          aria-label="Ouvrir"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-[13px] border border-[#E8E2DC] bg-white text-[#123A63]  transition hover:border-[#F15A24]/30 hover:bg-[#FFF7F2] hover:text-[#F15A24]"
                        >
                          <ActionIcon type="open" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setReplaceId(doc.id || "")}
                          title="Remplacer"
                          aria-label="Remplacer"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-[13px] border border-[#E8E2DC] bg-white text-[#123A63]  transition hover:border-[#F15A24]/30 hover:bg-[#FFF7F2] hover:text-[#F15A24]"
                        >
                          <ActionIcon type="replace" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDoc(doc.id)}
                          title="Supprimer"
                          aria-label="Supprimer"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-[13px] border border-red-100 bg-red-50 text-red-700  transition hover:border-red-200 hover:bg-red-100"
                        >
                          <ActionIcon type="delete" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2.2rem] border border-[#E8E2DC] bg-white p-7 -[0_18px_45px_rgba(18,58,99,0.06)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F15A24]">Statuts</p>
              <h2 className="mt-2 text-2xl font-black">Pilotage du dossier</h2>

              <div className="mt-5 grid gap-4">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#123A63]">Statut paiement</span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      setPaymentStatus(e.target.value);
                      updateStatuses(e.target.value, dossierStatus);
                    }}
                    disabled={busy}
                    className="w-full rounded-[16px] border border-[#E8E2DC] bg-[#FBFCFD] px-4 py-4 text-sm font-black text-[#123A63] outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10 disabled:opacity-60"
                  >
                    {paymentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#123A63]">Statut du dossier</span>
                  <select
                    value={dossierStatus}
                    onChange={(e) => {
                      setDossierStatus(e.target.value);
                      updateStatuses(paymentStatus, e.target.value);
                    }}
                    disabled={busy}
                    className="w-full rounded-[16px] border border-[#E8E2DC] bg-[#FBFCFD] px-4 py-4 text-sm font-black text-[#123A63] outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10 disabled:opacity-60"
                  >
                    {dossierOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Résumé actuel
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusBadge(paymentStatus, "payment")}
                  {statusBadge(dossierStatus, "dossier")}
                </div>
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-[#E8E2DC] bg-white p-7 -[0_18px_45px_rgba(18,58,99,0.06)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F15A24]">Messages</p>
              <h2 className="mt-2 text-2xl font-black">Conversation client</h2>

              <div className="mt-5 max-h-[220px] space-y-3 overflow-auto rounded-[18px] border border-[#E8E2DC] bg-[#FBFCFD] p-4">
                {messages.length === 0 ? (
                  <p className="text-sm font-black text-slate-400">Aucun message.</p>
                ) : (
                  messages.map((m, i) => (
                    <div key={m.id || i} className="rounded-[16px] border border-[#E8E2DC] bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#F15A24]">
                          {m.sender || "message"}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400">{fmtTime(m.created_at)}</p>
                      </div>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{m.message}</p>
                    </div>
                  ))
                )}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message au client..."
                className="mt-5 min-h-[130px] w-full rounded-[18px] border border-[#E8E2DC] bg-white px-5 py-4 text-sm font-bold outline-none focus:border-[#F15A24] focus:ring-4 focus:ring-[#F15A24]/10"
              />
              <button
                onClick={sendMessage}
                disabled={busy}
                className="mt-4 w-full rounded-[18px] bg-[#F15A24] px-6 py-4 text-sm font-black text-white -[0_16px_34px_rgba(241,90,36,.22)] hover:bg-[#D94A1B] disabled:opacity-60"
              >
                Envoyer →
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
