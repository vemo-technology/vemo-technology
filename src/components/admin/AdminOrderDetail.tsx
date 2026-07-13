"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Order = Record<string, any>;

type AdminDocument = {
  id: string;
  created_at: string;
  order_id: string;
  uploaded_by: string;
  document_type: string;
  document_label: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  status: string;
  admin_comment: string | null;
  reviewed_at: string | null;
  signed_url?: string | null;
};

const adminStatuses = [
  { value: "new", label: "Nouveau" },
  { value: "paid_to_process", label: "Payé à traiter" },
  { value: "in_progress", label: "En cours" },
  { value: "waiting_client", label: "Attente client" },
  { value: "documents_prepared", label: "Documents prêts" },
  { value: "completed", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
];

const documentTypes = [
  { value: "prepared_document", label: "Document préparé" },
  { value: "articles_of_organization", label: "Articles of Organization" },
  { value: "operating_agreement", label: "EIN application" },
  { value: "ein_document", label: "Document EIN" },
  { value: "state_confirmation", label: "Confirmation État" },
  { value: "banking_document", label: "Document bancaire" },
  { value: "other", label: "Autre document" },
];

const documentStatuses = [
  { value: "uploaded", label: "Uploadé" },
  { value: "needs_signature", label: "À signer" },
  { value: "signed_received", label: "Signé reçu" },
  { value: "approved", label: "Validé" },
  { value: "rejected", label: "Refusé" },
];

async function logoutAdmin() {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.href = "/admin/connexion";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(value?: number | null) {
  if (!value) return "-";

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function FieldCard({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words font-black text-[#111a33]">
        {value === null || value === undefined || value === "" ? "-" : String(value)}
      </p>
    </div>
  );
}

function documentStatusClass(status: string) {
  if (status === "approved") return "bg-green-50 text-green-700";
  if (status === "rejected") return "bg-rose-50 text-rose-700";
  if (status === "needs_signature") return "bg-amber-50 text-amber-700";
  if (status === "signed_received") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

export default function AdminOrderDetail() {
  const params = useParams();
  const id = String(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);

  const [adminStatus, setAdminStatus] = useState("new");
  const [internalNotes, setInternalNotes] = useState("");

  const [documentType, setDocumentType] = useState("prepared_document");
  const [documentLabel, setDocumentLabel] = useState("Document préparé");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceDocumentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadOrder() {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(result);
      setErrorMessage(
        response.status === 401
          ? "Session admin expirée. Reconnectez-vous."
          : "Impossible de charger ce dossier."
      );
      setLoading(false);

      if (response.status === 401) {
        window.location.href = "/admin/connexion";
      }

      return;
    }

    setOrder(result.order);
    setAdminStatus(result.order?.admin_status || "new");
    setInternalNotes(result.order?.internal_notes || "");
    setLoading(false);
  }

  async function loadDocuments() {
    setDocumentsLoading(true);
    setErrorMessage("");

    const response = await fetch(`/api/admin/order-documents?orderId=${encodeURIComponent(id)}`, {
      method: "GET",
      cache: "no-store",
    });

    const result = await response.json();

    setDocumentsLoading(false);

    if (!response.ok) {
      console.error(result);
      setErrorMessage("Impossible de charger les documents.");
      return;
    }

    setDocuments(result.documents || []);
  }

  async function saveAdminTracking() {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        admin_status: adminStatus,
        internal_notes: internalNotes,
      }),
    });

    const result = await response.json();

    setSaving(false);

    if (!response.ok) {
      console.error(result);
      setErrorMessage(result.error || "Impossible de sauvegarder le suivi admin.");
      return;
    }

    setOrder(result.order);
    setSuccessMessage("Suivi admin sauvegardé.");
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedFile) {
      setErrorMessage("Choisis un fichier à uploader.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("document_type", documentType);
    formData.append("document_label", documentLabel || "Document");

    const response = await fetch(`/api/admin/order-documents?orderId=${encodeURIComponent(id)}`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    setUploading(false);

    if (!response.ok) {
      console.error(result);
      setErrorMessage(result.error || "Upload impossible.");
      return;
    }

    setSelectedFile(null);
    setDocumentLabel("Document préparé");
    setDocumentType("prepared_document");
    setSuccessMessage("Document uploadé avec succès.");
    await loadDocuments();
  }

  async function updateDocument(document: AdminDocument) {
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch("/api/admin/order-documents", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: document.id,
        status: document.status,
        admin_comment: document.admin_comment || "",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(result);
      setErrorMessage(result.error || "Impossible de mettre à jour le document.");
      return;
    }

    setSuccessMessage("Document mis à jour.");
    await loadDocuments();
  }

  async function deleteDocument(documentId: string) {
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch(`/api/admin/order-documents?documentId=${encodeURIComponent(documentId)}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(result);
      setErrorMessage(result.error || "Impossible de supprimer le document.");
      return;
    }

    setSuccessMessage("Document supprimé.");
    await loadDocuments();
  }

  useEffect(() => {
    loadOrder();
    loadDocuments();
  }, [id]);

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#111a33]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-10 py-5">
          <div>
            <p className="text-2xl font-black">Détail dossier LLC</p>
            <p className="text-sm font-bold text-slate-500">
              VEMO TECH Admin sécurisé
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/dossiers"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black hover:border-[#9F1239]"
            >
              Retour dossiers
            </a>

            <button
              onClick={logoutAdmin}
              className="rounded-2xl bg-[#111a33] px-5 py-3 text-sm font-black text-white"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-10 py-10">
        {loading && (
          <div className="rounded-[2rem] bg-white p-8 text-center font-black ">
            Chargement du dossier...
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-[2rem] bg-rose-50 p-6 font-black text-rose-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-[2rem] bg-green-50 p-6 font-black text-green-700">
            {successMessage}
          </div>
        )}

        {order && (
          <div className="grid gap-8 lg:grid-cols-[1fr_0.42fr]">
            <div className="rounded-[2rem] bg-white p-8 ">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9F1239]">
                    Dossier
                  </p>

                  <h1 className="mt-3 text-4xl font-black">
                    {order.full_company_name || "Sans nom"}
                  </h1>

                  <p className="mt-2 text-sm font-bold text-slate-500">
                    Créé le {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-5 py-4 text-right">
                  <p className="text-xs font-black uppercase text-slate-500">
                    Paiement
                  </p>

                  <p className="mt-1 text-2xl font-black text-[#9F1239]">
                    {order.payment_status || "pending"}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[2rem] border border-rose-100 bg-rose-50/40 p-6">
                <h2 className="text-2xl font-black">Suivi interne admin</h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Statut interne
                    </label>

                    <select
                      value={adminStatus}
                      onChange={(event) => setAdminStatus(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold outline-none focus:border-[#9F1239]"
                    >
                      {adminStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Dernière mise à jour admin
                    </label>

                    <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 font-black">
                      {formatDate(order.admin_updated_at)}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Notes internes
                  </label>

                  <textarea
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                    rows={7}
                    placeholder="Ajouter une note interne : documents à préparer, statut EIN, actions à faire..."
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold leading-7 outline-none focus:border-[#9F1239]"
                  />
                </div>

                <button
                  onClick={saveAdminTracking}
                  disabled={saving}
                  className="mt-5 rounded-2xl bg-[#9F1239] px-6 py-4 font-black text-white  disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Sauvegarde..." : "Sauvegarder le suivi admin"}
                </button>
              </div>

              <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Documents du dossier</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      Upload admin, liens privés, statuts et commentaires.
                    </p>
                  </div>

                  <button
                    onClick={loadDocuments}
                    className="rounded-2xl bg-[#111a33] px-5 py-3 text-sm font-black text-white"
                  >
                    Actualiser documents
                  </button>
                </div>

                <form
                  onSubmit={uploadDocument}
                  className="mt-6 rounded-[1.5rem] bg-slate-50 p-5"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Type document
                      </label>

                      <select
                        value={documentType}
                        onChange={(event) => {
                          setDocumentType(event.target.value);
                          const selected = documentTypes.find(
                            (item) => item.value === event.target.value
                          );
                          setDocumentLabel(selected?.label || "Document");
                        }}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold outline-none focus:border-[#9F1239]"
                      >
                        {documentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Libellé affiché
                      </label>

                      <input
                        value={documentLabel}
                        onChange={(event) => setDocumentLabel(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold outline-none focus:border-[#9F1239]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Fichier
                      </label>

                      <input
                        type="file"
                        onChange={(event) =>
                          setSelectedFile(event.target.files?.[0] || null)
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold outline-none focus:border-[#9F1239]"
                      />
                    </div>
                  </div>

                  <button
                  disabled={uploading}
                  type="submit"
                  style={{
                    background: "#F15A24",
                    backgroundColor: "#F15A24",
                    backgroundImage: "none",
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                  className="vemo-uploader-orange rounded-[16px] px-5 py-4 text-sm font-black text-white -[0_14px_28px_rgba(241,90,36,.20)] transition hover:opacity-90 disabled:opacity-60"
                >
                  {uploading ? "Upload..." : replaceDocumentId ? "Remplacer" : "Uploader"}
                </button>
                </form>

                {documentsLoading ? (
                  <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center font-black text-slate-500">
                    Chargement documents...
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
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
                              {document.file_name} · {formatFileSize(document.file_size)} ·{" "}
                              {formatDate(document.created_at)}
                            </p>

                            <span
                              className={[
                                "mt-3 inline-flex rounded-full px-3 py-2 text-xs font-black uppercase",
                                documentStatusClass(document.status),
                              ].join(" ")}
                            >
                              {document.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {document.signed_url && (
                              <a
                                href={document.signed_url}
                                target="_self"
                                rel="noreferrer"
                                className="rounded-xl bg-[#111a33] px-4 py-3 text-sm font-black text-white"
                              >
                                Ouvrir
                              </a>
                            )}

                            <button
                              onClick={() => deleteDocument(document.id)}
                              className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-[260px_1fr_auto] md:items-end">
                          <div>
                            <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                              Statut document
                            </label>

                            <select
                              value={document.status}
                              onChange={(event) =>
                                setDocuments((current) =>
                                  current.map((item) =>
                                    item.id === document.id
                                      ? { ...item, status: event.target.value }
                                      : item
                                  )
                                )
                              }
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold outline-none focus:border-[#9F1239]"
                            >
                              {documentStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                              Commentaire admin
                            </label>

                            <input
                              value={document.admin_comment || ""}
                              onChange={(event) =>
                                setDocuments((current) =>
                                  current.map((item) =>
                                    item.id === document.id
                                      ? { ...item, admin_comment: event.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="Ex : à signer, envoyé au client, refusé car incomplet..."
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold outline-none focus:border-[#9F1239]"
                            />
                          </div>

                          <button
                            onClick={() => updateDocument(document)}
                            className="rounded-2xl bg-[#9F1239] px-5 py-4 font-black text-white"
                          >
                            Sauvegarder
                          </button>
                        </div>
                      </div>
                    ))}

                    {documents.length === 0 && (
                      <div className="rounded-2xl bg-slate-50 p-6 text-center font-black text-slate-500">
                        Aucun document pour ce dossier.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-black">Client</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <FieldCard label="Prénom" value={order.first_name} />
                  <FieldCard label="Nom" value={order.last_name} />
                  <FieldCard label="Email" value={order.email} />
                  <FieldCard label="Téléphone" value={order.phone_e164} />
                  <FieldCard label="Pays résidence" value={order.residence_country} />
                  <FieldCard label="Langue" value={order.language} />
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-black">Société</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <FieldCard label="Nom société" value={order.company_name} />
                  <FieldCard label="Nom complet" value={order.full_company_name} />
                  <FieldCard label="Type entité" value={order.entity_type} />
                  <FieldCard label="État" value={order.jurisdiction} />
                  <FieldCard label="Formule" value={order.package_name} />
                  <FieldCard label="Management" value={order.management_type} />
                  <FieldCard label="Public listing" value={order.public_listing} />
                  <FieldCard label="Activité" value={order.business_activity} />
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-black">Membre / Manager</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <FieldCard label="Prénom" value={order.member_first_name} />
                  <FieldCard label="Nom" value={order.member_last_name} />
                  <FieldCard label="Pays" value={order.member_country} />
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-black">Message client</h2>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 font-bold leading-7 text-slate-700">
                  {order.message || "Aucun message."}
                </div>
              </div>
            </div>

            <aside className="rounded-[2rem] bg-white p-8 ">
              <h2 className="text-2xl font-black">Résumé paiement</h2>

              <div className="mt-6 space-y-5">
                <div className="flex justify-between gap-5">
                  <p className="font-bold text-slate-600">Service</p>
                  <p className="font-black">${order.service_fee || 0}</p>
                </div>

                <div className="flex justify-between gap-5">
                  <p className="font-bold text-slate-600">State filing fees</p>
                  <p className="font-black">${order.state_fee || 0}</p>
                </div>

                <div className="flex justify-between gap-5">
                  <p className="font-bold text-slate-600">Options</p>
                  <p className="font-black">${order.options_fee || 0}</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-5">
                  <div className="flex justify-between gap-5">
                    <p className="text-xl font-black">Total</p>
                    <p className="text-2xl font-black text-[#9F1239]">
                      ${order.total_amount || 0}
                    </p>
                  </div>
                </div>

                <FieldCard
                  label="Stripe PaymentIntent"
                  value={order.stripe_payment_intent_id}
                />

                <FieldCard label="Statut dossier" value={order.status} />
                <FieldCard label="Statut paiement" value={order.payment_status} />
                <FieldCard label="Statut interne" value={order.admin_status || "new"} />
                <FieldCard label="Dossier terminé le" value={formatDate(order.processed_at)} />
              </div>

              <button
                onClick={() => {
                  loadOrder();
                  loadDocuments();
                }}
                className="mt-8 w-full rounded-2xl bg-[#111a33] px-5 py-4 font-black text-white"
              >
                Actualiser
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

