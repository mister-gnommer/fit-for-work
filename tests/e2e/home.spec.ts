import { expect, test } from "@playwright/test";

test("the Polish entry page loads with its styles and no application errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push(request.url()));

  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page.getByRole("heading", { name: "Fit for Work" })).toBeVisible();
  await expect(page.getByText("Skierowania na badania medycyny pracy")).toBeVisible();
  await expect(page.locator('[data-slot="card"]')).toHaveCSS("border-top-width", "1px");
  expect(errors).toEqual([]);
});
