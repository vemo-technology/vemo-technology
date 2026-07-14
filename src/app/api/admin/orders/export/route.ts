import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/adminAuth";

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

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

export async function GET(request: Request) {
  try {
    const adminCheck = await verifyAdminRequest(request);
    if (adminCheck.ok === false) return adminCheck.response;

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("llc_orders")
      .select(`
        id,
        created_at,
        full_company_name,
        first_name,
        last_name,
        email,
        phone_e164,
        residence_country,
        jurisdiction,
        package_name,
        payment_status,
        status,
        admin_status,
        total_amount,
        currency,
        stripe_payment_intent_id,
        internal_notes
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      "id",
      "created_at",
      "company",
      "first_name",
      "last_name",
      "email",
      "phone",
      "country",
      "state",
      "package",
      "payment_status",
      "status",
      "admin_status",
      "total_amount",
      "currency",
      "stripe_payment_intent_id",
      "internal_notes",
    ];

    const rows = (data || []).map((order) =>
      [
        order.id,
        order.created_at,
        order.full_company_name,
        order.first_name,
        order.last_name,
        order.email,
        order.phone_e164,
        order.residence_country,
        order.jurisdiction,
        order.package_name,
        order.payment_status,
        order.status,
        order.admin_status,
        order.total_amount,
        order.currency,
        order.stripe_payment_intent_id,
        order.internal_notes,
      ]
        .map(csvEscape)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vemo-llc-orders.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}




