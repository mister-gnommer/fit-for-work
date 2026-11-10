import { afterAll, beforeAll, expect, test } from "vitest";

import type { CompanyContext, CurrentUser } from "@/lib/access";
import { createMigratedDatabase, type TempDatabase } from "@/test/temp-database";

// App modules read DATABASE_URL when first imported, so they are loaded after the temp database exists.
let database: TempDatabase;
let modules: Awaited<ReturnType<typeof loadModules>>;

async function loadModules() {
  return {
    ...(await import("@/lib/db")),
    ...(await import("@/lib/errors")),
    ...(await import("./service")),
  };
}

const telemediUser: CurrentUser = { id: "telemedi", name: "Telemedi", email: "telemedi@example.com", role: "TELEMEDI", companyId: null };

/** A company with an employee and an own factor, plus contexts for its operator, its admin and Telemedi. */
async function setUpCompany(nip: string) {
  const { db } = modules;
  const company = await db.company.create({ data: { name: `Firma ${nip}`, city: "Wrocław", buildingNumber: "1", postalCode: "50-001", nip } });
  const operator = await db.user.create({
    data: { name: "Operator", email: `operator.${nip}@example.com`, role: "OPERATOR", companyId: company.id },
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
  const factor = await db.riskFactor.create({ data: { companyId: company.id, category: "OTHER", name: "Podnoszenie ładunków" } });
  const asOperator: CompanyContext = { user: operator, companyId: company.id };
  const asAdmin: CompanyContext = { user: { ...operator, id: `admin-${nip}`, role: "ADMIN" }, companyId: company.id };
  const asTelemedi: CompanyContext = { user: telemediUser, companyId: company.id };
  return { asOperator, asAdmin, asTelemedi, employee, factor };
}

/** Issues a referral at the given moment and returns its id. */
async function issue(ctx: CompanyContext, employeeId: string, factorId: string, examType: "PERIODIC" | "FOLLOW_UP", now: string): Promise<string> {
  const result = await modules.createReferral(
    ctx,
    employeeId,
    {
      examType,
      employmentStatus: "EMPLOYED",
      position: "Magazynier",
      workDescription: "Kompletacja zamówień.",
      deadline: "2026-12-31",
      factors: [{ id: factorId, exposureLevel: null }],
    },
    new Date(now),
  );
  if (!result.ok) {
    throw new Error(`Referral not created: ${JSON.stringify(result.errors)}`);
  }
  return result.id;
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

test("referrals are listed from their snapshots and only Telemedi changes or deletes them", async () => {
  const { db, listReferrals, setReferralStatus, deleteReferral, getReferral, ForbiddenError, NotFoundError } = modules;
  const a = await setUpCompany("5210001126");
  const b = await setUpCompany("5830002226");
  const older = await issue(a.asOperator, a.employee.id, a.factor.id, "PERIODIC", "2026-11-09T10:00:00Z");
  const newer = await issue(a.asOperator, a.employee.id, a.factor.id, "FOLLOW_UP", "2026-11-10T10:00:00Z");

  // Newest first, with the snapshot's data; another company sees none of them.
  expect(await listReferrals(a.asOperator)).toEqual([
    { id: newer, status: "CREATED", deadline: "2026-12-31", employeeName: "Jan Kowalski", examType: "FOLLOW_UP", issueDate: "2026-11-10" },
    { id: older, status: "CREATED", deadline: "2026-12-31", employeeName: "Jan Kowalski", examType: "PERIODIC", issueDate: "2026-11-09" },
  ]);
  expect(await listReferrals(b.asOperator)).toEqual([]);

  // Renaming and deleting the employee doesn't change or hide the referrals.
  await db.employee.update({ where: { id: a.employee.id }, data: { lastName: "Nowak", deletedAt: new Date() } });
  expect((await listReferrals(a.asOperator)).map((referral) => referral.employeeName)).toEqual(["Jan Kowalski", "Jan Kowalski"]);

  // Telemedi sets any status, from any status.
  await setReferralStatus(a.asTelemedi, older, "DONE");
  await setReferralStatus(a.asTelemedi, newer, "CANCELLED");
  await setReferralStatus(a.asTelemedi, newer, "IN_PROGRESS");
  expect((await listReferrals(a.asOperator)).map((referral) => referral.status)).toEqual(["IN_PROGRESS", "DONE"]);

  // HR can't change or delete; Telemedi in another company finds nothing.
  for (const ctx of [a.asOperator, a.asAdmin]) {
    await expect(setReferralStatus(ctx, older, "CANCELLED")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(deleteReferral(ctx, older)).rejects.toBeInstanceOf(ForbiddenError);
  }
  await expect(setReferralStatus(b.asTelemedi, older, "CANCELLED")).rejects.toBeInstanceOf(NotFoundError);
  await expect(deleteReferral(b.asTelemedi, older)).rejects.toBeInstanceOf(NotFoundError);
  expect(await db.referral.findUniqueOrThrow({ where: { id: older } })).toMatchObject({ status: "DONE", deletedAt: null });

  // A deleted referral leaves the list and can't be opened, changed or deleted again; the row stays.
  await deleteReferral(a.asTelemedi, older);
  expect((await listReferrals(a.asOperator)).map((referral) => referral.id)).toEqual([newer]);
  await expect(getReferral(a.asOperator, older)).rejects.toBeInstanceOf(NotFoundError);
  await expect(setReferralStatus(a.asTelemedi, older, "CREATED")).rejects.toBeInstanceOf(NotFoundError);
  await expect(deleteReferral(a.asTelemedi, older)).rejects.toBeInstanceOf(NotFoundError);
  expect(await db.referral.findUniqueOrThrow({ where: { id: older } })).toMatchObject({ deletedAt: expect.any(Date) });
});
