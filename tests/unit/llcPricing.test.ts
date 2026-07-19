import { describe, expect, it } from "vitest";
import { resolveLlcPack } from "@/lib/llcPricing";

describe("server-side LLC pricing", () => {
  it("resolves the catalog price and ignores a forged client total", async () => {
    const pack = await resolveLlcPack({
      total: 1,
      amount: 1,
      form: { state: "newMexico", pack: "standard" },
    });
    expect(pack).toMatchObject({ id: "nm-standard", amount: 149, currency: "USD" });
  });

  it("rejects unknown states and packages", async () => {
    await expect(resolveLlcPack({ form: { state: "Florida", pack: "free" } })).resolves.toBeNull();
  });
});
