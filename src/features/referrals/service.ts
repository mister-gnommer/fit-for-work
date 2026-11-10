import "server-only";

import { z } from "zod";

import { ExamType, type ReferralStatus, Role } from "@/generated/prisma/enums";
import type { CompanyContext } from "@/lib/access";
import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { optionalText, requiredText } from "@/lib/forms";

import { getEmployee } from "../employees/service";
import { buildSnapshot, referralSnapshotSchema, warsawDate } from "./snapshot";

/** True for a `yyyy-MM-dd` string that names a real calendar date. */
function isRealDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
}

/**
 * Validation for the referral form. The deadline rule depends on today's date in Poland, so the
 * schema is built per request.
 * @param today `yyyy-MM-dd` in Europe/Warsaw
 */
export function referralInputSchema(today: string) {
  return z.object({
    examType: z.enum(ExamType, "Wybierz rodzaj badania."),
    employmentStatus: z.enum(["EMPLOYED", "TAKING_UP_WORK"], "Wybierz status zatrudnienia."),
    position: requiredText("Podaj stanowisko."),
    workDescription: requiredText("Podaj opis pracy."),
    deadline: z
      .string("Podaj termin.")
      .refine(isRealDate, "Podaj poprawną datę.")
      .refine((value) => value >= today, "Termin nie może być wcześniejszy niż dzisiaj."),
    factors: z
      .array(z.object({ id: z.string().min(1), exposureLevel: optionalText.refine((value) => (value ?? "").length <= 200, "Poziom narażenia może mieć najwyżej 200 znaków.") }))
      .min(1, "Wybierz co najmniej jeden czynnik szkodliwy.")
      .refine((factors) => new Set(factors.map((factor) => factor.id)).size === factors.length, "Czynnik wybrano więcej niż raz."),
  });
}

export type ReferralInput = z.infer<ReturnType<typeof referralInputSchema>>;

export type CreateReferralResult = { ok: true; id: string } | { ok: false; errors: Record<string, string> };

/**
 * Freezes a referral for one of the company's employees. The factors must be predefined or the
 * company's own, and none may be deleted.
 * @param now the moment of issue; a parameter so tests can fix the date
 */
export async function createReferral(ctx: CompanyContext, employeeId: string, input: ReferralInput, now = new Date()): Promise<CreateReferralResult> {
  const employee = await getEmployee(ctx, employeeId);
  const company = await db.company.findUniqueOrThrow({ where: { id: ctx.companyId } });
  const ids = input.factors.map((factor) => factor.id);
  const rows = await db.riskFactor.findMany({
    where: { id: { in: ids }, deletedAt: null, OR: [{ companyId: null }, { companyId: ctx.companyId }] },
    select: { id: true, category: true, name: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const factors = input.factors.flatMap((factor) => {
    const row = byId.get(factor.id);
    return row ? [{ category: row.category, name: row.name, exposureLevel: factor.exposureLevel }] : [];
  });
  if (factors.length !== input.factors.length) {
    return { ok: false, errors: { factors: "Lista czynników się zmieniła. Odśwież formularz i wybierz je ponownie." } };
  }

  const snapshot = referralSnapshotSchema.parse(buildSnapshot({ company, employee, input, factors, issueDate: warsawDate(now) }));
  const referral = await db.referral.create({
    data: {
      companyId: ctx.companyId,
      employeeId: employee.id,
      createdById: ctx.user.id,
      examType: input.examType,
      deadline: input.deadline,
      snapshot,
      createdAt: now,
    },
    select: { id: true },
  });
  return { ok: true, id: referral.id };
}

/** A referral of the context's company that isn't deleted, with its snapshot parsed and typed. */
export async function getReferral(ctx: CompanyContext, id: string) {
  const referral = await db.referral.findFirst({
    where: { id, companyId: ctx.companyId, deletedAt: null },
    select: { id: true, status: true, deadline: true, snapshot: true },
  });
  if (!referral) {
    throw new NotFoundError();
  }
  return { ...referral, snapshot: referralSnapshotSchema.parse(referral.snapshot) };
}

/**
 * The company's referrals that aren't deleted, newest first. Names and dates come from each
 * snapshot, so renamed or deleted employees show as they were issued.
 */
export async function listReferrals(ctx: CompanyContext) {
  const referrals = await db.referral.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, deadline: true, snapshot: true },
  });
  return referrals.map(({ snapshot, ...referral }) => {
    const { employee, examType, issueDate } = referralSnapshotSchema.parse(snapshot);
    return { ...referral, employeeName: `${employee.firstName} ${employee.lastName}`, examType, issueDate };
  });
}

/** Sets a referral's status; any status may follow any other (ledger Q5). Telemedi only. */
export async function setReferralStatus(ctx: CompanyContext, id: string, status: ReferralStatus): Promise<void> {
  await updateAsTelemedi(ctx, id, { status });
}

/** Soft deletes a referral; its summary and PDF become unavailable. Telemedi only. */
export async function deleteReferral(ctx: CompanyContext, id: string): Promise<void> {
  await updateAsTelemedi(ctx, id, { deletedAt: new Date() });
}

async function updateAsTelemedi(ctx: CompanyContext, id: string, data: { status?: ReferralStatus; deletedAt?: Date }): Promise<void> {
  if (ctx.user.role !== Role.TELEMEDI) {
    throw new ForbiddenError();
  }
  const { count } = await db.referral.updateMany({ where: { id, companyId: ctx.companyId, deletedAt: null }, data });
  if (count === 0) {
    throw new NotFoundError();
  }
}
