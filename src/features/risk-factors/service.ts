import "server-only";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { RiskCategory } from "@/generated/prisma/enums";
import type { CompanyContext } from "@/lib/access";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { requiredText, type ServiceResult } from "@/lib/forms";

export const riskFactorSchema = z.object({
  category: z.enum(RiskCategory, "Wybierz kategorię."),
  name: requiredText("Podaj nazwę czynnika.").max(200, "Nazwa może mieć najwyżej 200 znaków."),
});

export type RiskFactorInput = z.infer<typeof riskFactorSchema>;

const DUPLICATE: ServiceResult = { ok: false, errors: { name: "Taki czynnik już istnieje w tej kategorii." } };

/** Predefined factors plus the company's own, none deleted, oldest first. */
export function listRiskFactors(companyId: string) {
  return db.riskFactor.findMany({
    where: { deletedAt: null, OR: [{ companyId: null }, { companyId }] },
    orderBy: { createdAt: "asc" },
    select: { id: true, category: true, name: true, companyId: true },
  });
}

/**
 * One of the company's own factors that isn't deleted. Predefined factors and other companies'
 * factors look like they don't exist, which is what makes them read-only here.
 */
export async function getCompanyRiskFactor(ctx: CompanyContext, id: string) {
  const factor = await db.riskFactor.findFirst({
    where: { id, companyId: ctx.companyId, deletedAt: null },
    select: { id: true, category: true, name: true },
  });
  if (!factor) {
    throw new NotFoundError();
  }
  return factor;
}

/** Adds a factor to the context's company. */
export async function createRiskFactor(ctx: CompanyContext, input: RiskFactorInput): Promise<ServiceResult> {
  return saveUnique(input, () => db.riskFactor.create({ data: { ...input, companyId: ctx.companyId } }));
}

/** Changes the category and name of one of the company's own factors. */
export async function updateRiskFactor(ctx: CompanyContext, id: string, input: RiskFactorInput): Promise<ServiceResult> {
  await getCompanyRiskFactor(ctx, id);
  return saveUnique(input, () => db.riskFactor.update({ where: { id }, data: input }));
}

/** Soft deletes one of the company's own factors. */
export async function deleteRiskFactor(ctx: CompanyContext, id: string): Promise<void> {
  const { count } = await db.riskFactor.updateMany({
    where: { id, companyId: ctx.companyId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (count === 0) {
    throw new NotFoundError();
  }
}

// A name may not repeat a predefined factor (checked here) or another own factor that isn't
// deleted (enforced by the partial unique index) in the same category.
async function saveUnique(input: RiskFactorInput, save: () => Promise<unknown>): Promise<ServiceResult> {
  if (await db.riskFactor.findFirst({ where: { companyId: null, category: input.category, name: input.name }, select: { id: true } })) {
    return DUPLICATE;
  }
  try {
    await save();
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return DUPLICATE;
    }
    throw error;
  }
}
