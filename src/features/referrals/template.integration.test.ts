import { afterAll, beforeAll, expect, test } from "vitest";

import { createMigratedDatabase, type TempDatabase } from "@/test/temp-database";

// App modules read DATABASE_URL when first imported, so they are loaded after the temp database exists.
let database: TempDatabase;
let modules: Awaited<ReturnType<typeof loadModules>>;

async function loadModules() {
  return {
    ...(await import("@/lib/db")),
    ...(await import("@/features/risk-factors/predefined")),
    templates: await import("@/features/templates/service"),
    referrals: await import("./service"),
  };
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

test("a referral started from a template freezes the template's live factors", async () => {
  const { db, templates, referrals } = modules;
  const company = await db.company.create({ data: { name: "Firma", city: "Wrocław", buildingNumber: "1", postalCode: "50-001", nip: "5210001126" } });
  const user = await db.user.create({
    data: { name: "Operator", email: "operator@example.com", role: "OPERATOR", companyId: company.id },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  });
  const ctx = { user, companyId: company.id };
  const employee = await db.employee.create({
    data: { companyId: company.id, firstName: "Jan", lastName: "Kowalski", sex: "MALE", pesel: "44051401359", city: "Wrocław", buildingNumber: "2", position: "Magazynier", workDescription: "Kompletacja." },
  });
  const noise = await db.riskFactor.findFirstOrThrow({ where: { companyId: null, name: "Hałas" } });
  const lifting = await db.riskFactor.create({ data: { companyId: company.id, category: "OTHER", name: "Podnoszenie ładunków" } });
  const retired = await db.riskFactor.create({ data: { companyId: company.id, category: "OTHER", name: "Stary czynnik" } });
  const input = {
    name: "Magazynier",
    factors: [
      { riskFactorId: noise.id, exposureLevel: "85 dB" },
      { riskFactorId: lifting.id, exposureLevel: null },
      { riskFactorId: retired.id, exposureLevel: null },
    ],
  };
  expect(await templates.createTemplate(ctx, input)).toEqual({ ok: true });
  const { id: templateId } = await db.referralTemplate.findFirstOrThrow({ where: { companyId: company.id } });
  await db.riskFactor.update({ where: { id: retired.id }, data: { deletedAt: new Date() } });

  // What the form pre-ticks and the demo seed submits: the template's factors that aren't deleted.
  const template = await templates.getTemplate(ctx, templateId);
  const result = await referrals.createReferral(ctx, employee.id, {
    examType: "PERIODIC",
    employmentStatus: "EMPLOYED",
    position: employee.position,
    workDescription: employee.workDescription,
    deadline: "2030-01-01",
    factors: template.factors.map((factor) => ({ id: factor.riskFactorId, exposureLevel: factor.exposureLevel })),
  });
  if (!result.ok) {
    throw new Error(JSON.stringify(result.errors));
  }
  const expected = [
    { category: "PHYSICAL", name: "Hałas", exposureLevel: "85 dB" },
    { category: "OTHER", name: "Podnoszenie ładunków", exposureLevel: null },
  ];
  expect((await referrals.getReferral(ctx, result.id)).snapshot.factors).toEqual(expected);

  // Editing the template afterwards doesn't reach the referral.
  const edited = { name: "Magazynier", factors: [{ riskFactorId: noise.id, exposureLevel: "95 dB" }] };
  expect(await templates.updateTemplate(ctx, templateId, edited)).toEqual({ ok: true });
  expect((await referrals.getReferral(ctx, result.id)).snapshot.factors).toEqual(expected);
});
