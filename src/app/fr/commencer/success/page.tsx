import { redirect } from "next/navigation";

type SearchValue = string | string[] | undefined;

type Props = {
  searchParams?: Promise<Record<string, SearchValue>>;
};

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function Page({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};

  const method = [
    first(params.payment_method),
    first(params.method),
    first(params.mode),
  ]
    .join(" ")
    .toLowerCase();

  if (/bank|transfer|virement|wire/.test(method)) {
    redirect("/fr/commencer?payment=transfer&legacy=1");
  }

  const targetParams = new URLSearchParams();

  for (const key of [
    "session_id",
    "email",
    "customer_email",
    "payment_intent",
  ]) {
    const value = first(params[key]);
    if (value) targetParams.set(key, value);
  }

  const query = targetParams.toString();

  redirect(`/fr/paiement/success${query ? `?${query}` : ""}`);
}
