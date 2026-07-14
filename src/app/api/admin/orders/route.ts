import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/lib/adminAuth";

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
        language,
        status,
        payment_status,
        admin_status,
        package_name,
        jurisdiction,
        full_company_name,
        first_name,
        last_name,
        email,
        phone_e164,
        total_amount,
        currency,
        stripe_payment_intent_id
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}




