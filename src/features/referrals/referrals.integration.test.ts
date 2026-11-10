import { afterAll, beforeAll, expect, test } from "vitest";

import { createMigratedDatabase, type TempDatabase } from "@/test/temp-database";

// App modules read DATABASE_URL when first imported, so they are loaded after the temp database exists.
let database: TempDatabase;
let modules: Awaited<ReturnType<typeof loadModules>>;

async function loadModules() {
  return {
    ...(await import("@/lib/db")),
    ...(await import("@/lib/errors")),
    ...(await import("@/features/risk-factors/predefined")),
    ...(await import("./service")),
  };
}

// 23:30 in Warsaw (winter time): the referral is issued on 2026-11-10.
const NOW = new Date("2026-11-10T22:30:00Z");

/** A company with one operator, one employee and one own factor; returns its context and ids. */
async function setUpCompany(nip: string, city: string) {
  const { db } = modules;
  const company = await db.company.create({ data: { name: `Firma ${nip}`, city, buildingNumber: "1", postalCode: "50-001", nip } });
  const user = await db.user.create({
    data: { name: "Operator", email: `${nip}@example.com`, role: "OPERATOR", companyId: company.id },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  });
  const employee = await db.employee.create({
    data: {
      companyId: company.id,
      firstName: "Jan",
      lastName: "Kowalski",
      sex: "MALE",
      pesel: "44051401359",
      city: "Wrocław",
      buildingNumber: "2",
      position: "Magazynier",
      workDescription: "Kompletacja zamówień.",
    },
  });
  const ownFactor = await db.riskFactor.create({ data: { companyId: company.id, category: "OTHER", name: "Podnoszenie ładunków" } });
  return { ctx: { user, companyId: company.id }, employee, ownFactor };
}

beforeAll(async () => {
  database = await createMigratedDatabase();
  process.env.DATABASE_URL = database.url;
  modules = await loadModules();
  await modules.ensurePredefinedRiskFactors();
});

afterAll(async () => {
  await modules?.db.$disconnect();
  await database?.remove();
});

test("a referral is frozen, scoped to its company and only uses allowed factors", async () => {
  const { db } = modules;
  const a = await setUpCompany("5210001126", "Wrocław");
  const b = await setUpCompany("5830002226", "Gdańsk");
  const noise = await db.riskFactor.findFirstOrThrow({ where: { companyId: null, name: "Hałas" } });
  const input = {
    examType: "PERIODIC" as const,
    employmentStatus: "EMPLOYED" as const,
    position: "Starszy magazynier",
    workDescription: "Obsługa wózka widłowego.",
    deadline: "2026-11-10",
    factors: [
      { id: a.ownFactor.id, exposureLevel: null },
      { id: noise.id, exposureLevel: "85 dB" },
    ],
  };

  const result = await modules.createReferral(a.ctx, a.employee.id, input, NOW);
  if (!result.ok) {
    throw new Error(`Referral not created: ${JSON.stringify(result.errors)}`);
  }
  const stored = await db.referral.findUniqueOrThrow({ where: { id: result.id } });
  expect(stored).toMatchObject({ status: "CREATED", createdById: a.ctx.user.id, examType: "PERIODIC", deadline: "2026-11-10" });

  const before = (await modules.getReferral(a.ctx, result.id)).snapshot;
  expect(before).toMatchObject({ issuePlace: "Wrocław", issueDate: "2026-11-10", position: "Starszy magazynier", employmentStatus: "EMPLOYED" });
  expect(before.factors).toEqual([
    { category: "PHYSICAL", name: "Hałas", exposureLevel: "85 dB" },
    { category: "OTHER", name: "Podnoszenie ładunków", exposureLevel: null },
  ]);

  // Later edits don't reach the referral.
  await db.employee.update({ where: { id: a.employee.id }, data: { position: "Kierownik", lastName: "Nowak" } });
  await db.riskFactor.update({ where: { id: a.ownFactor.id }, data: { name: "Zmieniona nazwa", deletedAt: new Date() } });
  await db.company.update({ where: { id: a.ctx.companyId }, data: { city: "Opole" } });
  expect((await modules.getReferral(a.ctx, result.id)).snapshot).toEqual(before);

  // Another company can't see it.
  await expect(modules.getReferral(b.ctx, result.id)).rejects.toBeInstanceOf(modules.NotFoundError);

  // Another company's employee, or a deleted one, isn't found.
  await expect(modules.createReferral(a.ctx, b.employee.id, input, NOW)).rejects.toBeInstanceOf(modules.NotFoundError);
  await db.employee.update({ where: { id: b.employee.id }, data: { deletedAt: new Date() } });
  await expect(modules.createReferral(b.ctx, b.employee.id, { ...input, factors: [{ id: noise.id, exposureLevel: null }] }, NOW)).rejects.toBeInstanceOf(modules.NotFoundError);

  // Another company's factor, or a deleted one, is rejected.
  const changed = { ok: false, errors: { factors: "Lista czynników się zmieniła. Odśwież formularz i wybierz je ponownie." } };
  expect(await modules.createReferral(a.ctx, a.employee.id, { ...input, factors: [{ id: b.ownFactor.id, exposureLevel: null }] }, NOW)).toEqual(changed);
  expect(await modules.createReferral(a.ctx, a.employee.id, { ...input, factors: [{ id: a.ownFactor.id, exposureLevel: null }] }, NOW)).toEqual(changed);
  expect(await db.referral.count()).toBe(1);

  // The deadline can't be before the day of issue in Poland.
  const schema = modules.referralInputSchema("2026-11-10");
  expect(schema.safeParse({ ...input, deadline: "2026-11-09" }).success).toBe(false);
  expect(schema.safeParse({ ...input, deadline: "2026-02-30" }).success).toBe(false);
  expect(schema.safeParse({ ...input, factors: [] }).success).toBe(false);
});
