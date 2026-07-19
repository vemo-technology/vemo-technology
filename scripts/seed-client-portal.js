const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Variables Supabase manquantes dans .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const email = "test@gmail.com";
  const token = "ac50e00c-71c7-4072-b670-a6b564273550";

  const { data: existingOrder } = await supabase
    .from("llc_orders")
    .select("*")
    .eq("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let orderId = existingOrder?.id || null;

  if (!orderId) {
    const { data: insertedOrder, error: orderError } = await supabase
      .from("llc_orders")
      .insert({
        status: "paid",
        payment_status: "paid",
        customer_email: email,
        customer_name: "Client Test",
        company_name: "TEST LLC",
        plan_name: "Standard",
        state: "New Mexico",
        amount: 399,
        currency: "usd",
        services: ["Operating Agreement", "EIN"],
        dossier: {},
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Erreur création order:", orderError);
      process.exit(1);
    }

    orderId = insertedOrder.id;
  }

  const { data: account, error: accountError } = await supabase
    .from("client_accounts")
    .upsert(
      {
        order_id: orderId,
        email,
        full_name: "Client Test",
        company_name: "TEST LLC",
        plan_name: "Standard",
        status: "active",
        portal_enabled: true,
        access_token: token,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "email",
      }
    )
    .select("*")
    .single();

  if (accountError) {
    console.error("Erreur création compte client:", accountError);
    process.exit(1);
  }

  console.log("Compte client créé/réparé :");
  console.log(account);
  console.log("");
  console.log("Lien espace client :");
  console.log(`http://localhost:3000/fr/espace-client?token=${token}`);
}

main();
