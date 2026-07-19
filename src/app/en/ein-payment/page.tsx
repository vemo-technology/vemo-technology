import EinPaymentLikeLlc from "@/components/ein/EinPaymentLikeLlc";

function valueOf(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] || "" : input || "";
}

export default async function EnglishEinPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <EinPaymentLikeLlc
      locale="en"
      email={valueOf(params.email)}
      companyName={valueOf(params.companyName)}
      fullName={valueOf(params.fullName)}
      stateName={valueOf(params.state)}
    />
  );
}
