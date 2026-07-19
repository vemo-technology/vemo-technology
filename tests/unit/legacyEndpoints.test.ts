import { describe, expect, it } from "vitest";
import { POST as legacyCheckout } from "@/app/api/stripe/create-embedded-checkout-session/route";
import { POST as legacyRegistration } from "@/app/api/client-portal/register-after-payment/route";
import { POST as legacyIntent } from "@/app/api/payments/create-intent/route";
import { POST as legacyCheckoutSession } from "@/app/api/stripe/create-checkout-session/route";
import { POST as legacyPaymentIntent } from "@/app/api/stripe/create-payment-intent/route";
import { POST as legacyMarkPaid } from "@/app/api/orders/mark-paid/route";
import { GET as legacyProfile } from "@/app/api/client-portal/profile/route";
import { POST as legacyStripeCheckout } from "@/app/api/stripe/checkout/route";
import { POST as legacyVerifyPayment } from "@/app/api/stripe/verify-payment/route";
import { POST as legacyBankTransfer } from "@/app/api/payments/bank-transfer/route";
import { GET as legacyClientOrder } from "@/app/api/client/order/route";
import { GET as legacyClientDocuments } from "@/app/api/client/documents/route";
import { POST as legacySendVerification } from "@/app/api/llc/send-verification/route";

describe("disabled insecure legacy endpoints", () => {
  it("rejects client-priced checkout", async () => {
    expect((await legacyCheckout()).status).toBe(410);
  });

  it("rejects unverified account provisioning", async () => {
    expect((await legacyRegistration()).status).toBe(410);
  });

  it.each([
    legacyIntent,
    legacyCheckoutSession,
    legacyPaymentIntent,
    legacyMarkPaid,
    legacyStripeCheckout,
    legacyVerifyPayment,
    legacyBankTransfer,
    legacySendVerification,
  ])(
    "rejects client-controlled payment mutations",
    async (handler) => expect((await handler()).status).toBe(410),
  );

  it("rejects email-address legacy profile access", async () => {
    expect((await legacyProfile()).status).toBe(410);
  });

  it.each([legacyClientOrder, legacyClientDocuments])(
    "rejects access tokens carried in URLs",
    async (handler) => expect((await handler()).status).toBe(410),
  );
});
