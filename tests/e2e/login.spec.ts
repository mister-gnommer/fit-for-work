import { expect, test } from "@playwright/test";

test("Telemedi logs in, switches company and logs out", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page.getByRole("heading", { name: "Fit for Work" })).toBeVisible();

  await page.getByLabel("E-mail").fill("telemedi@example.com");
  await page.getByLabel("Hasło").fill("wrong-password");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page.getByText("Nieprawidłowy e-mail lub hasło.")).toBeVisible();

  await page.getByLabel("Hasło").fill("Demo123!haslo");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/companies$/);
  await expect(page.getByRole("cell", { name: "Przykładowa Logistyka Sp. z o.o." })).toBeVisible();

  await page.getByLabel("Firma").selectOption({ label: "Przykładowa Logistyka Sp. z o.o." });
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("cell", { name: "Magdalena Wiśniewska" })).toBeVisible();

  await page.getByRole("button", { name: "Wyloguj" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/users");
  await expect(page).toHaveURL(/\/login$/);

  expect(errors).toEqual([]);
});
