// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function sanitized<T extends Record<string, any> | null>(record: T) {
  if (!record) return record;
  const blocked = new Set([
    "access_token",
    "client_access_token",
    "stripe_session_id",
    "proof_storage_path",
  ]);
  return Object.fromEntries(Object.entries(record).filter(([key]) => !blocked.has(key)));
}

async function ensureDefaultDocuments({
  supabase,
  email,
  orderId,
}: {
  supabase: ReturnType<typeof createClient>;
  email: string;
  orderId: string | null;
}) {
  const defaultDocs = [
    {
      title: "Company Document",
      document_key: "company_document",
      status: "pending",
      required: false,
      admin_comment: "Document officiel de formation.",
    },
    {
      title: "Operating Agreement",
      document_key: "operating_agreement",
      status: "pending",
      required: false,
      admin_comment: "Document d’exploitation de la LLC.",
    },
    {
      title: "EIN Letter",
      document_key: "ein_letter",
      status: "pending",
      required: false,
      admin_comment: "Disponible après traitement IRS.",
    },
  ];

  for (const doc of defaultDocs) {
    const { data: existingDoc } = await supabase
      .from("client_documents")
      .select("id")
      .eq("client_email", email)
      .eq("document_key", doc.document_key)
      .maybeSingle();

    const existingDocSafe = existingDoc as { id?: string } | null;

    if (!existingDocSafe?.id) {
      await supabase.from("client_documents").insert({
        order_id: orderId,
        client_email: email,
        title: doc.title,
        document_key: doc.document_key,
        status: doc.status,
        required: doc.required,
        admin_comment: doc.admin_comment,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        {
          error:
            "Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Session client introuvable." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Session client invalide ou expirée." },
        { status: 401 }
      );
    }

    const email = user.email.trim().toLowerCase();

    const { data: latestOrder } = await supabase
      .from("llc_orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const paymentState = String(
      latestOrder?.payment_status || latestOrder?.status || ""
    ).toLowerCase();
    const hasVerifiedPayment = ["paid", "verified", "completed", "succeeded"].includes(
      paymentState
    );

    if (!latestOrder || !hasVerifiedPayment) {
      return NextResponse.json(
        { error: "Aucune commande payée et vérifiée pour ce compte." },
        { status: 403 }
      );
    }

    const { data: existingAccount, error: accountReadError } = await supabase
      .from("client_accounts")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (accountReadError) {
      return NextResponse.json(
        {
          error: "Impossible de lire l’espace client.",
          details: accountReadError.message,
        },
        { status: 500 }
      );
    }

    let account = existingAccount;

    if (!account?.id) {
      const { data: insertedAccount, error: insertError } = await supabase
        .from("client_accounts")
        .insert({
          order_id: latestOrder?.id || null,
          email,
          full_name:
            user.user_metadata?.full_name ||
            latestOrder?.customer_name ||
            null,
          company_name:
            latestOrder?.company_name ||
            latestOrder?.full_company_name ||
            "Client LLC",
          plan_name: latestOrder?.package_name || "LLC Package",
          status: "active",
          portal_enabled: true,
          access_token: crypto.randomUUID(),
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (insertError) {
        return NextResponse.json(
          {
            error: "Impossible de créer l’espace client.",
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      account = insertedAccount;
    } else if (!account.portal_enabled || account.status !== "active") {
      const { data: updatedAccount, error: updateError } = await supabase
        .from("client_accounts")
        .update({
          portal_enabled: true,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id)
        .select("*")
        .single();

      if (!updateError && updatedAccount) {
        account = updatedAccount;
      }
    }

    await ensureDefaultDocuments({
      supabase,
      email,
      orderId: account?.order_id || latestOrder?.id || null,
    });

    const { data: documents } = await supabase
      .from("client_documents")
      .select("*")
      .eq("client_email", email)
      .order("updated_at", { ascending: false });

    const { data: messages } = await supabase
      .from("client_messages")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: false })
      .limit(30);

    const safeDocuments = await Promise.all((documents || []).map(async (document: any) => {
      const storagePath = String(document.storage_path || "");
      if (!storagePath) return { ...document, file_url: null, url: null };
      const bucket = storagePath.startsWith("bank-transfers/") ? "payment-proofs" : "client-documents";
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 5 * 60);
      return { ...sanitized(document), storage_path: undefined, file_url: signed?.signedUrl || null, url: signed?.signedUrl || null };
    }));

    return NextResponse.json({
      ok: true,
      email,
      account: sanitized(account),
      order: sanitized(latestOrder),
      documents: safeDocuments,
      messages: messages || [],
    });
  } catch (error) {
    console.error("client portal order error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur pendant le chargement de l’espace client.",
      },
      { status: 500 }
    );
  }
}
