import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { createMigratedDatabase, type TempDatabase } from "@/test/temp-database";

// App modules read DATABASE_URL when first imported, so they are loaded after the temp
// database exists.
let database: TempDatabase;
let modules: Awaited<ReturnType<typeof loadModules>>;

async function loadModules() {
  return {
    ...(await import("@/lib/auth")),
    ...(await import("@/lib/db")),
    ...(await import("@/lib/errors")),
    companies: await import("@/features/companies/service"),
    users: await import("@/features/users/service"),
  };
}

const company = (nip: string) => ({
  name: "Firma Testowa",
  city: "Wrocław",
  street: null,
  buildingNumber: "1",
  flatNumber: null,
  postalCode: "50-001",
  nip,
});

/** Builds the company context the access helpers would produce for this user. */
async function contextFor(email: string, companyId?: string) {
  const user = await modules.db.user.findUniqueOrThrow({
    where: { email },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  });
  const contextCompanyId = companyId ?? user.companyId;
  if (!contextCompanyId) {
    throw new Error("Telemedi needs an explicit company");
  }
  return { user, companyId: contextCompanyId };
}

async function canLogIn(email: string, password: string): Promise<boolean> {
  return modules.auth.api.signInEmail({ body: { email, password } }).then(
    () => true,
    () => false,
  );
}

beforeAll(async () => {
  database = await createMigratedDatabase();
  process.env.DATABASE_URL = database.url;
  process.env.BETTER_AUTH_SECRET = "integration-test-secret-integration-test-secret";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  modules = await loadModules();
  await modules.createUserWithPassword({ name: "Telemedi", email: "telemedi@example.com", password: "telemedi-pass", role: "TELEMEDI", companyId: null });
});

afterAll(async () => {
  await modules?.db.$disconnect();
  await database?.remove();
});

describe("accounts and company access", () => {
  let companyA: string;
  let companyB: string;

  test("Telemedi sets up a company with an admin and an operator who can log in", async () => {
    const telemedi = await modules.db.user.findUniqueOrThrow({ where: { email: "telemedi@example.com" } });
    expect(await modules.companies.createCompany(telemedi, company("5210001126"))).toEqual({ ok: true });
    expect(await modules.companies.createCompany(telemedi, company("5830002226"))).toEqual({ ok: true });
    [companyA, companyB] = (await modules.companies.listCompanies()).map((row) => row.id);

    const asTelemedi = await contextFor("telemedi@example.com", companyA);
    expect(await modules.users.createUser(asTelemedi, { name: "Admin A", email: "admin.a@example.com", password: "admin-pass", role: "ADMIN" })).toEqual({ ok: true });
    expect(await modules.users.createUser(asTelemedi, { name: "Second admin", email: "admin.a2@example.com", password: "admin-pass", role: "ADMIN" })).toEqual({
      ok: false,
      errors: { role: "Ta firma ma już administratora." },
    });

    const asAdmin = await contextFor("admin.a@example.com");
    expect(await modules.users.createUser(asAdmin, { name: "Operator A", email: "operator.a@example.com", password: "operator-pass", role: "OPERATOR" })).toEqual({ ok: true });
    await expect(modules.users.createUser(asAdmin, { name: "Admin B", email: "x@example.com", password: "admin-pass", role: "ADMIN" })).rejects.toBeInstanceOf(modules.ForbiddenError);

    await expect(
      modules.createUserWithPassword({ name: "No company", email: "orphan@example.com", password: "orphan-pass", role: "OPERATOR", companyId: null }),
    ).rejects.toThrow("must belong to a company");
    expect(await modules.db.user.count({ where: { email: "orphan@example.com" } })).toBe(0);

    expect(await canLogIn("OPERATOR.A@example.com", "operator-pass")).toBe(true);
    expect(await canLogIn("operator.a@example.com", "wrong-pass")).toBe(false);

    const asOperator = await contextFor("operator.a@example.com");
    await expect(modules.users.createUser(asOperator, { name: "X", email: "y@example.com", password: "operator-pass", role: "OPERATOR" })).rejects.toBeInstanceOf(modules.ForbiddenError);
  });

  test("NIP must be unique among companies that aren't deleted", async () => {
    const telemedi = (await contextFor("telemedi@example.com", companyB)).user;
    expect(await modules.companies.createCompany(telemedi, company("5830002226"))).toEqual({ ok: false, errors: { nip: "Firma z tym NIP-em już istnieje." } });
    expect(await modules.companies.updateCompany(telemedi, companyA, company("5830002226"))).toEqual({ ok: false, errors: { nip: "Firma z tym NIP-em już istnieje." } });

    await modules.companies.deleteCompany(telemedi, companyB);
    expect(await modules.companies.createCompany(telemedi, company("5830002226"))).toEqual({ ok: true });
  });

  test("an admin resets an operator's password, ending their sessions", async () => {
    const operator = await contextFor("operator.a@example.com");
    expect(await canLogIn("operator.a@example.com", "operator-pass")).toBe(true);
    expect(await modules.db.session.count({ where: { userId: operator.user.id } })).toBeGreaterThan(0);

    await modules.users.changePassword(await contextFor("admin.a@example.com"), operator.user.id, "new-operator-pass");

    expect(await modules.db.session.count({ where: { userId: operator.user.id } })).toBe(0);
    expect(await canLogIn("operator.a@example.com", "operator-pass")).toBe(false);
    expect(await canLogIn("operator.a@example.com", "new-operator-pass")).toBe(true);
  });

  test("another company's user looks like it doesn't exist", async () => {
    const companyC = (await modules.companies.listCompanies()).at(-1)?.id ?? "";
    const asTelemediInC = await contextFor("telemedi@example.com", companyC);
    await modules.users.createUser(asTelemediInC, { name: "Operator C", email: "operator.c@example.com", password: "operator-pass", role: "OPERATOR" });
    const operatorC = await contextFor("operator.c@example.com");

    const asAdminA = await contextFor("admin.a@example.com");
    await expect(modules.users.changePassword(asAdminA, operatorC.user.id, "hijacked-pass")).rejects.toBeInstanceOf(modules.NotFoundError);
    await expect(modules.users.deleteUser(asAdminA, operatorC.user.id)).rejects.toBeInstanceOf(modules.NotFoundError);
    expect(await canLogIn("operator.c@example.com", "operator-pass")).toBe(true);
  });

  test("deleted users and users of deleted companies can't log in, and emails stay taken", async () => {
    const operator = await contextFor("operator.a@example.com");
    await modules.users.deleteUser(operator, operator.user.id);
    expect(await canLogIn("operator.a@example.com", "new-operator-pass")).toBe(false);
    expect(await modules.db.session.count({ where: { userId: operator.user.id } })).toBe(0);

    const asAdmin = await contextFor("admin.a@example.com");
    expect(await modules.users.createUser(asAdmin, { name: "Again", email: "Operator.A@example.com", password: "operator-pass", role: "OPERATOR" })).toEqual({
      ok: false,
      errors: { email: "Ten adres e-mail jest już używany." },
    });

    expect(await canLogIn("admin.a@example.com", "admin-pass")).toBe(true);
    const telemedi = (await contextFor("telemedi@example.com", companyA)).user;
    await modules.companies.deleteCompany(telemedi, companyA);
    expect(await canLogIn("admin.a@example.com", "admin-pass")).toBe(false);
  });
});
