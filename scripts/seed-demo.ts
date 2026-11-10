// Loads the synthetic demo accounts, companies and employees from docs/seed/demo.json.
// Idempotent: users are matched by email and companies by NIP, employees are only added to a
// company that has none, and existing records are left unchanged.
// Later changes extend this with risk factors, templates and referrals.
import "dotenv/config";

import { readFile } from "node:fs/promises";

import type { Role } from "@/generated/prisma/enums";
import { employeeSchema } from "@/features/employees/service";
import { createUserWithPassword } from "@/lib/auth";
import { db } from "@/lib/db";

type DemoAccount = { name: string; email: string; password: string };
type DemoCompany = {
  name: string;
  city: string;
  street?: string;
  buildingNumber: string;
  flatNumber?: string;
  postalCode: string;
  nip: string;
  admin: DemoAccount;
  operators: DemoAccount[];
  employees: Record<string, string>[];
};
type Demo = { telemedi: DemoAccount; companies: DemoCompany[] };

/** Creates the account unless a user with this email already exists. */
async function ensureUser(account: DemoAccount, role: Role, companyId: string | null): Promise<void> {
  if (await db.user.findUnique({ where: { email: account.email }, select: { id: true } })) {
    return;
  }
  await createUserWithPassword({ ...account, role, companyId });
}

/** The demo company with this NIP, created if missing. */
async function ensureCompany(company: DemoCompany): Promise<string> {
  const existing = await db.company.findFirst({ where: { nip: company.nip, deletedAt: null }, select: { id: true } });
  if (existing) {
    return existing.id;
  }
  const { name, city, street, buildingNumber, flatNumber, postalCode, nip } = company;
  const created = await db.company.create({ data: { name, city, street, buildingNumber, flatNumber, postalCode, nip } });
  return created.id;
}

/** Adds the demo employees, validated like form input, unless the company already has employees. */
async function ensureEmployees(companyId: string, employees: Record<string, string>[]): Promise<void> {
  if (await db.employee.count({ where: { companyId, deletedAt: null } })) {
    return;
  }
  await db.employee.createMany({ data: employees.map((employee) => ({ ...employeeSchema.parse(employee), companyId })) });
}

try {
  const demo: Demo = JSON.parse(await readFile("docs/seed/demo.json", "utf8"));
  await ensureUser(demo.telemedi, "TELEMEDI", null);
  for (const company of demo.companies) {
    const companyId = await ensureCompany(company);
    await ensureUser(company.admin, "ADMIN", companyId);
    for (const operator of company.operators) {
      await ensureUser(operator, "OPERATOR", companyId);
    }
    await ensureEmployees(companyId, company.employees);
  }
  console.log(`Demo seed: ${await db.company.count()} companies, ${await db.user.count()} users, ${await db.employee.count()} employees.`);
} finally {
  await db.$disconnect();
}
