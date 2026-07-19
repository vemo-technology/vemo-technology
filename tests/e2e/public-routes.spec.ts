import { expect, test } from "@playwright/test";

for (const locale of ["fr", "en"] as const) {
  test(`${locale} public home and critical routes render`, async ({ page }) => {
    test.setTimeout(90_000);
    for (const path of [`/${locale}`, `/${locale}/connexion`, `/${locale}/commencer`, `/${locale}/contact`]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      expect(response?.status(), path).toBeLessThan(400);
      await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error/i);
    }
  });
}

test("anonymous admin and client access is redirected", async ({ page }) => {
  await page.goto("/fr/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/fr\/admin\/login|\/fr\/admin-login/);
  await page.goto("/fr/espace-client", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/fr\/connexion/);
});
