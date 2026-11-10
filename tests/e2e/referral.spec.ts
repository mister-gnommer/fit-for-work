import { expect, test } from "@playwright/test";

test("an operator creates a referral from a template and downloads its PDF", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/login");
  await page.getByLabel("E-mail").fill("operator1.logistyka@example.com");
  await page.getByLabel("Hasło").fill("Demo123!haslo");
  await page.getByRole("button", { name: "Zaloguj się" }).click();

  // Waiting for the redirect keeps the next navigation from racing the session cookie.
  await expect(page).not.toHaveURL(/\/login$/);
  await page.goto("/referrals/new");
  await page.getByLabel("Pracownik").selectOption({ index: 0 });
  await page.getByLabel("Szablon").selectOption({ label: "Magazynier" });
  await page.getByRole("button", { name: "Dalej" }).click();
  await expect(page.getByText("Szablon: Magazynier")).toBeVisible();
  await expect(page.getByLabel("Stanowisko")).not.toHaveValue("");

  // The template's three factors arrive ticked, with its exposure level.
  const hallNoise = page.getByRole("checkbox", { name: /Hałas na hali 85 dB/ });
  const shiftWork = page.getByRole("checkbox", { name: /Praca zmianowa, w tym praca w porze nocnej/ });
  await expect(hallNoise).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Podnoszenie ładunków powyżej 25 kg/ })).toBeChecked();
  await expect(shiftWork).toBeChecked();
  await expect(page.getByLabel("Wielkość narażenia: Hałas na hali 85 dB")).toHaveValue("85 dB LEX,8h");

  // Adjust before saving.
  await shiftWork.uncheck();
  await page.getByLabel("Wielkość narażenia: Hałas na hali 85 dB").fill("87 dB LEX,8h");
  await page.getByLabel("Rodzaj badania").selectOption("PRE_EMPLOYMENT");
  await expect(page.getByLabel("Status zatrudnienia")).toHaveValue("TAKING_UP_WORK");
  await page.getByLabel("Termin").fill("2030-01-15");
  await page.getByRole("button", { name: "Utwórz skierowanie" }).click();

  await expect(page.getByRole("heading", { name: "Skierowanie" })).toBeVisible();
  await expect(page.getByText("Osoba podejmująca pracę")).toBeVisible();
  await expect(page.getByText("2030-01-15")).toBeVisible();
  const link = page.getByRole("link", { name: "Pobierz PDF" });
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/referrals\/.+\/pdf$/);

  // page.request shares the browser's session cookie.
  const pdf = await page.request.get(href ?? "");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  expect(errors).toEqual([]);
});
