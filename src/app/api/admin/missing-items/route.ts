import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function checkAdmin(request: Request) {
  return verifyAdminRequest(request);
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdmin(request);

    if (auth.ok === false) {
      return auth.response;
    }

    const body = await request.json();

    const orderId = String(body.orderId || "").trim();
    const clientEmail = String(body.clientEmail || "").trim().toLowerCase();
    const missingItems = Array.isArray(body.missingItems)
      ? body.missingItems
          .map((item: unknown) => String(item || "").trim())
          .filter(Boolean)
      : [];

    if (!orderId && !clientEmail) {
      return NextResponse.json(
        { error: "orderId ou clientEmail requis." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    let targetOrderId = orderId;

    if (!targetOrderId && clientEmail) {
      const { data: latestOrder } = await supabase
        .from("llc_orders")
        .select("id")
        .eq("customer_email", clientEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      targetOrderId = latestOrder?.id || "";
    }

    if (!targetOrderId) {
      return NextResponse.json(
        { error: "Commande client introuvable." },
        { status: 404 }
      );
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("llc_orders")
      .update({
        missing_items: missingItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetOrderId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          error: "Impossible de mettre à jour les éléments manquants.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    if (clientEmail) {
      if (missingItems.length > 0) {
        await supabase.from("client_messages").insert({
          order_id: targetOrderId,
          client_email: clientEmail,
          sender: "Admin Vemo",
          message: `Action requise : ${missingItems.join(", ")}.`,
          message_type: "missing_items",
          is_read: false,
        });
      } else {
        await supabase.from("client_messages").insert({
          order_id: targetOrderId,
          client_email: clientEmail,
          sender: "Admin Vemo",
          message: "Merci. Aucune information manquante n’est actuellement demandée.",
          message_type: "missing_items",
          is_read: false,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue.";

    return NextResponse.json(
      {
        error: "Impossible de mettre à jour les informations manquantes.",
        details: message,
      },
      { status: 500 }
    );
  }
}



