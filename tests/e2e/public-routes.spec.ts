import { expect, test } from "@playwright/test";

for (const locale of ["fr", "en"] as const) {
  test(`${locale} public home and critical routes render`, async ({ page }) => {
    for (const path of [`/${locale}`, `/${locale}/connexion`, `/${locale}/commencer`, `/${locale}/contact`]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBeLessThan(400);
      await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error/i);
    }
  });
}

test("anonymous admin and client access is redirected", async ({ page }) => {
  await page.goto("/fr/admin");
  await expect(page).toHaveURL(/\/fr\/admin\/login|\/fr\/admin-login/);
  await page.goto("/fr/espace-client");
  await expect(page).toHaveURL(/\/fr\/connexion/);
});
