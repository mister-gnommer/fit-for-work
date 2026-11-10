import { afterAll, beforeAll, describe, expect, test } from "vitest";

import type { CompanyContext } from "@/lib/access";
import { createMigratedDatabase, type TempDatabase } from "@/test/temp-database";

// App modules read DATABASE_URL when first imported, so they are loaded after the temp
// database exists.
let database: TempDatabase;
let modules: Awaited<ReturnType<typeof loadModules>>;

async function loadModules() {
  return {
    ...(await import("@/lib/db")),
    ...(await import("@/lib/errors")),
    ...(await import("@/features/risk-factors/predefined")),
    riskFactors: await import("@/features/risk-factors/service"),
    templates: await import("@/features/templates/service"),
  };
}

const DUPLICATE_NAME = { ok: false, errors: { name: "Szablon o tej nazwie już istnieje." } };
const UNAVAILABLE = { ok: false, errors: { factors: "Wybrane czynniki są niedostępne. Odśwież stronę i spróbuj ponownie." } };

/** A company context as `requireCompanyContext()` would build it for one of the company's operators. */
async function companyContext(nip: string): Promise<CompanyContext> {
  const company = await modules.db.company.create({
    data: { name: `Firma ${nip}`, city: "Wrocław", buildingNumber: "1", postalCode: "50-001", nip },
  });
  return {
    user: { id: `operator-${nip}`, name: "Operator", email: `${nip}@example.com`, role: "OPERATOR", companyId: company.id },
    companyId: company.id,
  };
}

/** Creates one of the company's own factors and returns its id. */
async function ownFactor(ctx: CompanyContext, name: string): Promise<string> {
  await modules.riskFactors.createRiskFactor(ctx, { category: "OTHER", name });
  const factor = await modules.db.riskFactor.findFirstOrThrow({ where: { companyId: ctx.companyId, name } });
  return factor.id;
}

/** The template's factors as the edit page and create-referral see them. */
async function factorsOf(ctx: CompanyContext, id: string) {
  const template = await modules.templates.getTemplate(ctx, id);
  return template.factors.map((factor) => ({ name: factor.riskFactor.name, exposureLevel: factor.exposureLevel })).sort((a, b) => a.name.localeCompare(b.name));
}

async function templateId(ctx: CompanyContext, name: string): Promise<string> {
  const template = await modules.db.referralTemplate.findFirstOrThrow({ where: { companyId: ctx.companyId, name, deletedAt: null } });
  return template.id;
}

let noise: string;

beforeAll(async () => {
  database = await createMigratedDatabase();
  process.env.DATABASE_URL = database.url;
  modules = await loadModules();
  await modules.ensurePredefinedRiskFactors();
  noise = (await modules.db.riskFactor.findFirstOrThrow({ where: { companyId: null, name: "Hałas" } })).id;
});

afterAll(async () => {
  await modules?.db.$disconnect();
  await database?.remove();
});

describe("referral templates", () => {
  test("templates hold allowed factors, follow factor edits and have unique names per company", async () => {
    const companyA = await companyContext("5210001126");
    const companyB = await companyContext("5830002226");
    const { createTemplate, updateTemplate, deleteTemplate, listTemplates } = modules.templates;
    const lifting = await ownFactor(companyA, "Podnoszenie ładunków");
    const night = await ownFactor(companyA, "Praca nocna");
    const otherCompanyFactor = await ownFactor(companyB, "Obcy czynnik");

    expect(
      await createTemplate(companyA, {
        name: "Magazynier",
        factors: [
          { riskFactorId: noise, exposureLevel: "85 dB" },
          { riskFactorId: lifting, exposureLevel: null },
        ],
      }),
    ).toEqual({ ok: true });
    const magazynier = await templateId(companyA, "Magazynier");
    expect(await factorsOf(companyA, magazynier)).toEqual([
      { name: "Hałas", exposureLevel: "85 dB" },
      { name: "Podnoszenie ładunków", exposureLevel: null },
    ]);

    // Only predefined factors and the company's own live ones; nothing is written otherwise.
    expect(await createTemplate(companyA, { name: "Obcy", factors: [{ riskFactorId: otherCompanyFactor, exposureLevel: null }] })).toEqual(UNAVAILABLE);
    expect(await updateTemplate(companyA, magazynier, { name: "Zmieniony", factors: [{ riskFactorId: otherCompanyFactor, exposureLevel: null }] })).toEqual(UNAVAILABLE);
    expect(await modules.templates.getTemplate(companyA, magazynier)).toMatchObject({ name: "Magazynier" });
    expect(modules.templates.templateSchema.safeParse({ name: "Pusty", factors: [] }).success).toBe(false);

    // Editing replaces the selection.
    expect(
      await updateTemplate(companyA, magazynier, {
        name: "Magazynier",
        factors: [
          { riskFactorId: noise, exposureLevel: "80 dB" },
          { riskFactorId: night, exposureLevel: null },
        ],
      }),
    ).toEqual({ ok: true });
    expect(await factorsOf(companyA, magazynier)).toEqual([
      { name: "Hałas", exposureLevel: "80 dB" },
      { name: "Praca nocna", exposureLevel: null },
    ]);

    // Names are unique among the company's non-deleted templates only.
    const oneFactor = [{ riskFactorId: noise, exposureLevel: null }];
    expect(await createTemplate(companyA, { name: "Magazynier", factors: oneFactor })).toEqual(DUPLICATE_NAME);
    expect(await createTemplate(companyB, { name: "Magazynier", factors: oneFactor })).toEqual({ ok: true });
    expect(await createTemplate(companyA, { name: "Kierowca", factors: oneFactor })).toEqual({ ok: true });
    expect(await updateTemplate(companyA, await templateId(companyA, "Kierowca"), { name: "Magazynier", factors: oneFactor })).toEqual(DUPLICATE_NAME);

    // Templates follow their factors: a rename shows up, a deleted factor disappears.
    expect(await modules.riskFactors.updateRiskFactor(companyA, night, { category: "OTHER", name: "Praca w porze nocnej" })).toEqual({ ok: true });
    expect(await factorsOf(companyA, magazynier)).toContainEqual({ name: "Praca w porze nocnej", exposureLevel: null });
    await modules.riskFactors.deleteRiskFactor(companyA, night);
    expect(await factorsOf(companyA, magazynier)).toEqual([{ name: "Hałas", exposureLevel: "80 dB" }]);
    expect((await listTemplates(companyA)).find((template) => template.id === magazynier)?._count.factors).toBe(1);
    expect(await createTemplate(companyA, { name: "Nocny", factors: [{ riskFactorId: night, exposureLevel: null }] })).toEqual(UNAVAILABLE);

    // Soft delete hides the template, keeps the row, and frees the name.
    await deleteTemplate(companyA, magazynier);
    expect((await listTemplates(companyA)).map((template) => template.name)).toEqual(["Kierowca"]);
    expect(await modules.db.referralTemplate.findUnique({ where: { id: magazynier } })).toMatchObject({ deletedAt: expect.any(Date) });
    expect(await createTemplate(companyA, { name: "Magazynier", factors: oneFactor })).toEqual({ ok: true });
  });

  test("another company's or a deleted template is not found", async () => {
    const own = await companyContext("6750003336");
    const other = await companyContext("7740001454");
    const { createTemplate, deleteTemplate, getTemplate, updateTemplate } = modules.templates;
    const factors = [{ riskFactorId: noise, exposureLevel: null }];

    await createTemplate(own, { name: "Biuro", factors });
    const id = await templateId(own, "Biuro");

    await expect(getTemplate(other, id)).rejects.toBeInstanceOf(modules.NotFoundError);
    await expect(updateTemplate(other, id, { name: "Przejęty", factors })).rejects.toBeInstanceOf(modules.NotFoundError);
    await expect(deleteTemplate(other, id)).rejects.toBeInstanceOf(modules.NotFoundError);
    expect(await modules.db.referralTemplate.findUnique({ where: { id } })).toMatchObject({ name: "Biuro", deletedAt: null });

    await deleteTemplate(own, id);
    await expect(getTemplate(own, id)).rejects.toBeInstanceOf(modules.NotFoundError);
    await expect(updateTemplate(own, id, { name: "Biuro", factors })).rejects.toBeInstanceOf(modules.NotFoundError);
  });
});
