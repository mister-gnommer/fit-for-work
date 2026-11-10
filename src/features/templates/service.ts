import "server-only";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import type { CompanyContext } from "@/lib/access";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { requiredText, type ServiceResult } from "@/lib/forms";

export const templateSchema = z.object({
  name: requiredText("Podaj nazwę szablonu.").max(200, "Nazwa może mieć najwyżej 200 znaków."),
  factors: z
    .array(
      z.object({
        riskFactorId: z.string().min(1),
        exposureLevel: z.string().max(200, "Wielkość narażenia może mieć najwyżej 200 znaków.").nullable(),
      }),
    )
    .min(1, "Wybierz co najmniej jeden czynnik.")
    .refine((factors) => new Set(factors.map((factor) => factor.riskFactorId)).size === factors.length, "Każdy czynnik można wybrać tylko raz."),
});

export type TemplateInput = z.infer<typeof templateSchema>;

const DUPLICATE_NAME: ServiceResult = { ok: false, errors: { name: "Szablon o tej nazwie już istnieje." } };
const UNAVAILABLE_FACTORS: ServiceResult = {
  ok: false,
  errors: { factors: "Wybrane czynniki są niedostępne. Odśwież stronę i spróbuj ponownie." },
};

// A deleted factor disappears from every template through this filter; its join row stays until the template is saved again.
const LIVE_FACTOR = { riskFactor: { deletedAt: null } } satisfies Prisma.ReferralTemplateFactorWhereInput;

/** The company's templates that aren't deleted, by name, each with its number of live factors. */
export function listTemplates(ctx: CompanyContext) {
  return db.referralTemplate.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { factors: { where: LIVE_FACTOR } } } },
  });
}

/** A template of the context's company that isn't deleted, with its live factors and their exposure levels. */
export async function getTemplate(ctx: CompanyContext, id: string) {
  const template = await db.referralTemplate.findFirst({
    where: { id, companyId: ctx.companyId, deletedAt: null },
    select: {
      id: true,
      name: true,
      factors: {
        where: LIVE_FACTOR,
        select: { riskFactorId: true, exposureLevel: true, riskFactor: { select: { category: true, name: true } } },
      },
    },
  });
  if (!template) {
    throw new NotFoundError();
  }
  return template;
}

/** Creates a template in the context's company. */
export async function createTemplate(ctx: CompanyContext, input: TemplateInput): Promise<ServiceResult> {
  if (!(await factorsAvailable(ctx, input))) {
    return UNAVAILABLE_FACTORS;
  }
  return saveUniqueName(() =>
    db.referralTemplate.create({
      data: { companyId: ctx.companyId, name: input.name, factors: { create: input.factors } },
    }),
  );
}

/** Renames a template of the context's company and replaces its factors. */
export async function updateTemplate(ctx: CompanyContext, id: string, input: TemplateInput): Promise<ServiceResult> {
  await getTemplate(ctx, id);
  if (!(await factorsAvailable(ctx, input))) {
    return UNAVAILABLE_FACTORS;
  }
  return saveUniqueName(() =>
    db.$transaction([
      db.referralTemplate.update({ where: { id }, data: { name: input.name } }),
      db.referralTemplateFactor.deleteMany({ where: { templateId: id } }),
      db.referralTemplateFactor.createMany({ data: input.factors.map((factor) => ({ ...factor, templateId: id })) }),
    ]),
  );
}

/** Soft deletes a template of the context's company. */
export async function deleteTemplate(ctx: CompanyContext, id: string): Promise<void> {
  const { count } = await db.referralTemplate.updateMany({
    where: { id, companyId: ctx.companyId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (count === 0) {
    throw new NotFoundError();
  }
}

// Factor IDs come from the client: only predefined factors and the company's own live ones may be used.
async function factorsAvailable(ctx: CompanyContext, input: TemplateInput): Promise<boolean> {
  const ids = input.factors.map((factor) => factor.riskFactorId);
  const available = await db.riskFactor.count({
    where: { id: { in: ids }, deletedAt: null, OR: [{ companyId: null }, { companyId: ctx.companyId }] },
  });
  return available === ids.length;
}

// The schema rejects repeated factors, so the name is the only unique constraint a save can violate.
async function saveUniqueName(save: () => Promise<unknown>): Promise<ServiceResult> {
  try {
    await save();
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return DUPLICATE_NAME;
    }
    throw error;
  }
}
