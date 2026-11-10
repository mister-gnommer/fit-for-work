import { afterAll, beforeAll, expect, test } from "vitest";

import { createMigratedDatabase, type TempDatabase } from "@/test/temp-database";

// App modules read DATABASE_URL when first imported, so they are loaded after the temp database exists.
let database: TempDatabase;
let modules: Awaited<ReturnType<typeof loadModules>>;

async function loadModules() {
  return {
    ...(await import("@/lib/db")),
    ...(await import("@/lib/errors")),
    ...(await import("./predefined")),
    ...(await import("./service")),
  };
}

const DUPLICATE = { ok: false, errors: { name: "Taki czynnik już istnieje w tej kategorii." } };

/** A company context as requireCompanyContext() would build it for an operator of that company. */
async function companyContext(nip: string) {
  const company = await modules.db.company.create({
    data: { name: `Firma ${nip}`, city: "Wrocław", buildingNumber: "1", postalCode: "50-001", nip },
  });
  const user = { id: `operator-${nip}`, name: "Operator", email: `${nip}@example.com`, role: "OPERATOR" as const, companyId: company.id };
  return { user, companyId: company.id };
}

beforeAll(async () => {
  database = await createMigratedDatabase();
  process.env.DATABASE_URL = database.url;
  modules = await loadModules();
});

afterAll(async () => {
  await modules?.db.$disconnect();
  await database?.remove();
});

test("predefined and company risk factors", async () => {
  // Container start and the demo seed may run at the same time; the predefined list must not double.
  const added = await Promise.all([modules.ensurePredefinedRiskFactors(), modules.ensurePredefinedRiskFactors()]);
  expect(added[0] + added[1]).toBe(34);
  expect(await modules.ensurePredefinedRiskFactors()).toBe(0);
  expect(await modules.db.riskFactor.count({ where: { companyId: null } })).toBe(34);
  const noise = await modules.db.riskFactor.findFirstOrThrow({ where: { companyId: null, name: "Hałas" } });

  const companyA = await companyContext("5210001126");
  const companyB = await companyContext("5830002226");

  // Own factors: create, edit, and the duplicate rules.
  expect(await modules.createRiskFactor(companyA, { category: "OTHER", name: "Podnoszenie ładunków" })).toEqual({ ok: true });
  const lifting = await modules.db.riskFactor.findFirstOrThrow({ where: { companyId: companyA.companyId } });
  expect(await modules.updateRiskFactor(companyA, lifting.id, { category: "OTHER", name: "Podnoszenie ładunków powyżej 25 kg" })).toEqual({ ok: true });

  expect(await modules.createRiskFactor(companyA, { category: "PHYSICAL", name: "Hałas" })).toEqual(DUPLICATE);
  expect(await modules.createRiskFactor(companyA, { category: "OTHER", name: "Podnoszenie ładunków powyżej 25 kg" })).toEqual(DUPLICATE);
  expect(await modules.createRiskFactor(companyA, { category: "OTHER", name: "Hałas" })).toEqual({ ok: true });
  expect(await modules.createRiskFactor(companyB, { category: "OTHER", name: "Podnoszenie ładunków powyżej 25 kg" })).toEqual({ ok: true });
  const renamedOnto = await modules.db.riskFactor.findFirstOrThrow({ where: { companyId: companyA.companyId, name: "Hałas" } });
  expect(await modules.updateRiskFactor(companyA, renamedOnto.id, { category: "OTHER", name: "Podnoszenie ładunków powyżej 25 kg" })).toEqual(DUPLICATE);

  // Predefined factors and another company's factors look like they don't exist.
  const foreign = await modules.db.riskFactor.findFirstOrThrow({ where: { companyId: companyB.companyId } });
  for (const id of [noise.id, foreign.id]) {
    await expect(modules.updateRiskFactor(companyA, id, { category: "PHYSICAL", name: "Zmieniony" })).rejects.toBeInstanceOf(modules.NotFoundError);
    await expect(modules.deleteRiskFactor(companyA, id)).rejects.toBeInstanceOf(modules.NotFoundError);
  }
  expect((await modules.db.riskFactor.findUniqueOrThrow({ where: { id: noise.id } })).name).toBe("Hałas");

  const listA = await modules.listRiskFactors(companyA.companyId);
  expect(listA.filter((factor) => factor.companyId === null)).toHaveLength(34);
  expect(listA.filter((factor) => factor.companyId !== null).map((factor) => factor.name)).toEqual(["Podnoszenie ładunków powyżej 25 kg", "Hałas"]);

  // Soft delete hides the factor and frees its name.
  await modules.deleteRiskFactor(companyA, lifting.id);
  expect((await modules.listRiskFactors(companyA.companyId)).some((factor) => factor.id === lifting.id)).toBe(false);
  expect((await modules.db.riskFactor.findUniqueOrThrow({ where: { id: lifting.id } })).deletedAt).not.toBeNull();
  expect(await modules.createRiskFactor(companyA, { category: "OTHER", name: "Podnoszenie ładunków powyżej 25 kg" })).toEqual({ ok: true });
});
