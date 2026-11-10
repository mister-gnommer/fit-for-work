import "server-only";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { optionalText, requiredText, type ServiceResult } from "@/lib/forms";
import type { Account } from "@/lib/permissions";
import { isValidNip, isValidPostalCode, normalizeNip } from "@/lib/validation";

export const companySchema = z.object({
  name: requiredText("Podaj nazwę firmy."),
  city: requiredText("Podaj miejscowość."),
  street: optionalText,
  buildingNumber: requiredText("Podaj numer budynku."),
  flatNumber: optionalText,
  postalCode: z.string().trim().refine(isValidPostalCode, "Kod pocztowy musi mieć format 00-000."),
  nip: z.string().transform(normalizeNip).refine(isValidNip, "Nieprawidłowy NIP."),
});

export type CompanyInput = z.infer<typeof companySchema>;

const DUPLICATE_NIP: ServiceResult = { ok: false, errors: { nip: "Firma z tym NIP-em już istnieje." } };

/** Companies that aren't deleted, oldest first. */
export function listCompanies() {
  return db.company.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" } });
}

/** A company that isn't deleted. */
export async function getCompany(id: string) {
  const company = await db.company.findFirst({ where: { id, deletedAt: null } });
  if (!company) {
    throw new NotFoundError();
  }
  return company;
}

/** Creates a company. Telemedi only. */
export async function createCompany(actor: Account, input: CompanyInput): Promise<ServiceResult> {
  assertTelemedi(actor);
  return saveUniqueNip(() => db.company.create({ data: input }));
}

/** Updates a company that isn't deleted. Telemedi only. */
export async function updateCompany(actor: Account, id: string, input: CompanyInput): Promise<ServiceResult> {
  assertTelemedi(actor);
  await getCompany(id);
  return saveUniqueNip(() => db.company.update({ where: { id }, data: input }));
}

/** Soft deletes a company; its users are blocked from then on. Telemedi only. */
export async function deleteCompany(actor: Account, id: string): Promise<void> {
  assertTelemedi(actor);
  const { count } = await db.company.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  if (count === 0) {
    throw new NotFoundError();
  }
}

function assertTelemedi(actor: Account): void {
  if (actor.role !== Role.TELEMEDI) {
    throw new ForbiddenError();
  }
}

// NIP is the only unique column besides the id, so a unique violation means a duplicate NIP.
async function saveUniqueNip(save: () => Promise<unknown>): Promise<ServiceResult> {
  try {
    await save();
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return DUPLICATE_NIP;
    }
    throw error;
  }
}
