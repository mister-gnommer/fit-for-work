// Loads the synthetic demo data from docs/seed/demo.json. Idempotent: users are matched by email,
// companies by NIP, and employees, a company's own risk factors, templates and referrals are only
// added to a company that has none of them yet; existing records are left unchanged.
import "dotenv/config";

import { readFile } from "node:fs/promises";

import type { ExamType, ReferralStatus, Role } from "@/generated/prisma/enums";
import { employeeSchema } from "@/features/employees/service";
import { createReferral } from "@/features/referrals/service";
import { defaultEmploymentStatus } from "@/features/referrals/snapshot";
import { ensurePredefinedRiskFactors } from "@/features/risk-factors/predefined";
import { riskFactorSchema } from "@/features/risk-factors/service";
import { getTemplate, templateSchema } from "@/features/templates/service";
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
  customRiskFactors: unknown[];
  employees: Record<string, string>[];
  templates: DemoTemplate[];
  referrals: DemoReferral[];
};
type DemoFactor = { factorName: string; exposureLevel?: string };
type DemoTemplate = { name: string; factors: DemoFactor[] };
type DemoReferral = {
  employeeIndex: number;
  examType: ExamType;
  status: ReferralStatus;
  deadline: string;
  templateName?: string;
  factors?: DemoFactor[];
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

/** Adds the company's demo risk factors unless it already has own factors that aren't deleted. */
async function ensureCompanyRiskFactors(companyId: string, factors: unknown[]): Promise<void> {
  if (await db.riskFactor.count({ where: { companyId, deletedAt: null } })) {
    return;
  }
  // Parsing makes invalid seed data fail loudly instead of storing it.
  const data = factors.map((factor) => ({ ...riskFactorSchema.parse(factor), companyId }));
  await db.riskFactor.createMany({ data });
}

/** Adds the demo employees, validated like form input, unless the company already has employees. */
async function ensureEmployees(companyId: string, employees: Record<string, string>[]): Promise<void> {
  if (await db.employee.count({ where: { companyId, deletedAt: null } })) {
    return;
  }
  await db.employee.createMany({ data: employees.map((employee) => ({ ...employeeSchema.parse(employee), companyId })) });
}

/**
 * Looks up demo factors by name among the predefined and the company's own factors.
 * @param owner what uses the factors, for the error message
 */
async function resolveFactors(companyId: string, factors: DemoFactor[], owner: string) {
  const resolved = [];
  for (const { factorName, exposureLevel } of factors) {
    const factor = await db.riskFactor.findFirst({
      where: { name: factorName, deletedAt: null, OR: [{ companyId: null }, { companyId }] },
      select: { id: true },
    });
    if (!factor) {
      throw new Error(`Demo ${owner} uses an unknown risk factor: ${factorName}`);
    }
    resolved.push({ riskFactorId: factor.id, exposureLevel: exposureLevel ?? null });
  }
  return resolved;
}

/**
 * Creates the demo referrals through the same service as the form, as the company's first
 * operator, then sets each one's demo status. Skipped when the company has any referrals.
 */
async function ensureReferrals(companyId: string, company: DemoCompany): Promise<void> {
  if (company.referrals.length === 0 || (await db.referral.count({ where: { companyId } }))) {
    return;
  }
  const operator = await db.user.findFirst({
    where: { companyId, role: "OPERATOR", deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, companyId: true },
  });
  if (!operator) {
    throw new Error(`Demo company "${company.name}" needs an operator to create its referrals`);
  }
  const ctx = { user: operator, companyId };
  for (const referral of company.referrals) {
    // Employees are inserted together, so they're found by name rather than by insertion order.
    const { firstName, lastName } = company.employees[referral.employeeIndex];
    const employee = await db.employee.findFirstOrThrow({ where: { companyId, firstName, lastName, deletedAt: null } });
    const factors = referral.templateName
      ? (await getTemplate(ctx, (await db.referralTemplate.findFirstOrThrow({ where: { companyId, name: referral.templateName, deletedAt: null } })).id)).factors
      : await resolveFactors(companyId, referral.factors ?? [], `referral for ${firstName} ${lastName}`);
    const result = await createReferral(ctx, employee.id, {
      examType: referral.examType,
      employmentStatus: defaultEmploymentStatus(referral.examType),
      position: employee.position,
      workDescription: employee.workDescription,
      deadline: referral.deadline,
      factors: factors.map((factor) => ({ id: factor.riskFactorId, exposureLevel: factor.exposureLevel })),
    });
    if (!result.ok) {
      throw new Error(`Demo referral for ${firstName} ${lastName} failed: ${JSON.stringify(result.errors)}`);
    }
    await db.referral.update({ where: { id: result.id }, data: { status: referral.status } });
  }
}

/** Adds the demo templates, resolving factors by name, unless the company already has templates. */
async function ensureTemplates(companyId: string, templates: DemoTemplate[]): Promise<void> {
  if (await db.referralTemplate.count({ where: { companyId, deletedAt: null } })) {
    return;
  }
  for (const template of templates) {
    const factors = await resolveFactors(companyId, template.factors, `template "${template.name}"`);
    const { name, factors: parsed } = templateSchema.parse({ name: template.name, factors });
    await db.referralTemplate.create({ data: { companyId, name, factors: { create: parsed } } });
  }
}

try {
  const demo: Demo = JSON.parse(await readFile("docs/seed/demo.json", "utf8"));
  await ensurePredefinedRiskFactors();
  await ensureUser(demo.telemedi, "TELEMEDI", null);
  for (const company of demo.companies) {
    const companyId = await ensureCompany(company);
    await ensureUser(company.admin, "ADMIN", companyId);
    await ensureCompanyRiskFactors(companyId, company.customRiskFactors);
    for (const operator of company.operators) {
      await ensureUser(operator, "OPERATOR", companyId);
    }
    await ensureEmployees(companyId, company.employees);
    await ensureTemplates(companyId, company.templates);
    await ensureReferrals(companyId, company);
  }
  console.log(
    `Demo seed: ${await db.company.count()} companies, ${await db.user.count()} users, ${await db.employee.count()} employees, ${await db.riskFactor.count()} risk factors, ${await db.referralTemplate.count()} templates, ${await db.referral.count()} referrals.`,
  );
} finally {
  await db.$disconnect();
}
