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
    employees: await import("@/features/employees/service"),
  };
}

const PESEL = "84051712374";

/** A valid employee input, parsed the way the form action parses it. */
function employee(fields: Record<string, string>) {
  return modules.employees.employeeSchema.parse({
    firstName: "Anna",
    lastName: "Nowak",
    sex: "FEMALE",
    city: "Wrocław",
    buildingNumber: "1",
    position: "Magazynier",
    workDescription: "Praca w magazynie.",
    ...fields,
  });
}

const withoutPesel = { idDocumentName: "paszport", idDocumentNumber: "AB1234567", birthDate: "1980-05-05" };

/** A company context as `requireCompanyContext()` would build it for one of the company's operators. */
async function companyContext(nip: string): Promise<CompanyContext> {
  const company = await modules.db.company.create({
    data: { name: "Firma", city: "Wrocław", buildingNumber: "1", postalCode: "50-001", nip },
  });
  return {
    user: { id: `operator-${nip}`, name: "Operator", email: `${nip}@example.com`, role: "OPERATOR", companyId: company.id },
    companyId: company.id,
  };
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

describe("employees", () => {
  test("PESEL uniqueness is per company and among non-deleted employees only", async () => {
    const companyA = await companyContext("5210001126");
    const companyB = await companyContext("5830002226");
    const { createEmployee, deleteEmployee, listEmployees } = modules.employees;

    expect(await createEmployee(companyA, employee({ pesel: PESEL }))).toEqual({ ok: true });
    expect(await createEmployee(companyA, employee({ pesel: PESEL, firstName: "Ewa" }))).toEqual({
      ok: false,
      errors: { pesel: "Pracownik z tym numerem PESEL już istnieje." },
    });
    expect(await createEmployee(companyB, employee({ pesel: PESEL }))).toEqual({ ok: true });

    expect(await createEmployee(companyA, employee({ ...withoutPesel, lastName: "Bez" }))).toEqual({ ok: true });
    expect(await createEmployee(companyA, employee({ ...withoutPesel, lastName: "Cicha" }))).toEqual({ ok: true });

    const listed = await listEmployees(companyA);
    expect(listed.map((row) => row.lastName)).toEqual(["Bez", "Cicha", "Nowak"]);

    const withPesel = listed.find((row) => row.pesel === PESEL);
    if (!withPesel) {
      throw new Error("employee with PESEL missing");
    }
    await deleteEmployee(companyA, withPesel.id);
    expect((await listEmployees(companyA)).map((row) => row.lastName)).toEqual(["Bez", "Cicha"]);
    expect(await modules.db.employee.findUnique({ where: { id: withPesel.id } })).toMatchObject({ deletedAt: expect.any(Date) });

    expect(await createEmployee(companyA, employee({ pesel: PESEL, firstName: "Ewa" }))).toEqual({ ok: true });
  });

  test("another company's or a deleted employee is not found", async () => {
    const own = await companyContext("6750003336");
    const other = await companyContext("7740001454");
    const { createEmployee, deleteEmployee, getEmployee, listEmployees, updateEmployee } = modules.employees;

    await createEmployee(own, employee({ pesel: PESEL }));
    const [row] = await listEmployees(own);

    expect(await updateEmployee(own, row.id, employee({ pesel: PESEL, position: "Kierowca" }))).toEqual({ ok: true });
    expect((await getEmployee(own, row.id)).position).toBe("Kierowca");

    await expect(getEmployee(other, row.id)).rejects.toBeInstanceOf(modules.NotFoundError);
    await expect(updateEmployee(other, row.id, employee({ pesel: PESEL, position: "Hacker" }))).rejects.toBeInstanceOf(modules.NotFoundError);
    await expect(deleteEmployee(other, row.id)).rejects.toBeInstanceOf(modules.NotFoundError);
    expect(await modules.db.employee.findUnique({ where: { id: row.id } })).toMatchObject({ position: "Kierowca", deletedAt: null });

    await deleteEmployee(own, row.id);
    await expect(getEmployee(own, row.id)).rejects.toBeInstanceOf(modules.NotFoundError);
    await expect(updateEmployee(own, row.id, employee({ pesel: PESEL }))).rejects.toBeInstanceOf(modules.NotFoundError);
  });
});
