import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function GET(request: Request) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.ok === false) return adminCheck.response;

    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("orderId") || "");

    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("llc_order_documents")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Documents select error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const documents = await Promise.all(
      (data || []).map(async (document) => {
        const { data: signedData } = await supabase.storage
          .from("llc-documents")
          .createSignedUrl(document.file_path, 60 * 30);

        return {
          ...document,
          signed_url: signedData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json({ error: "Erreur chargement documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.ok === false) return adminCheck.response;

    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("orderId") || "");

    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum autorisé : 15 MB." },
        { status: 400 }
      );
    }

    const documentType = String(formData.get("document_type") || "prepared_document");
    const documentLabel = String(formData.get("document_label") || "Document préparé");

    const allowedTypes = [
      "prepared_document",
      "articles_of_organization",
      "operating_agreement",
      "ein_document",
      "state_confirmation",
      "banking_document",
      "other",
    ];

    if (!allowedTypes.includes(documentType)) {
      return NextResponse.json({ error: "Type document invalide" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const cleanName = cleanFileName(file.name || "document.pdf");
    const filePath = `${orderId}/admin/${Date.now()}-${cleanName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("llc-documents")
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: insertedDocument, error: insertError } = await supabase
      .from("llc_order_documents")
      .insert([
        {
          order_id: orderId,
          uploaded_by: "admin",
          document_type: documentType,
          document_label: documentLabel,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          status: "uploaded",
        },
      ])
      .select("*")
      .single();

    if (insertError) {
      console.error("Document insert error:", insertError);
      await supabase.storage.from("llc-documents").remove([filePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ document: insertedDocument });
  } catch (error) {
    console.error("Documents POST error:", error);
    return NextResponse.json(
      { error: "Erreur serveur pendant l’upload du document." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.ok === false) return adminCheck.response;

    const body = await request.json();

    const documentId = String(body.document_id || "");
    const status = String(body.status || "uploaded");
    const adminComment = String(body.admin_comment || "");

    if (!documentId) {
      return NextResponse.json({ error: "document_id manquant" }, { status: 400 });
    }

    const allowedStatuses = [
      "uploaded",
      "approved",
      "rejected",
      "needs_signature",
      "signed_received",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("llc_order_documents")
      .update({
        status,
        admin_comment: adminComment,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data });
  } catch (error) {
    console.error("Documents PATCH error:", error);
    return NextResponse.json({ error: "Erreur mise à jour document" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.ok === false) return adminCheck.response;

    const { searchParams } = new URL(request.url);
    const documentId = String(searchParams.get("documentId") || "");

    if (!documentId) {
      return NextResponse.json({ error: "documentId manquant" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: document, error: findError } = await supabase
      .from("llc_order_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (findError || !document) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    await supabase.storage.from("llc-documents").remove([document.file_path]);

    const { error: deleteError } = await supabase
      .from("llc_order_documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Documents DELETE error:", error);
    return NextResponse.json({ error: "Erreur suppression document" }, { status: 500 });
  }
}




