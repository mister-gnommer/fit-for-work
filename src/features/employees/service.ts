import "server-only";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { Sex } from "@/generated/prisma/enums";
import type { CompanyContext } from "@/lib/access";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { optionalText, requiredText, type ServiceResult } from "@/lib/forms";
import { isValidPesel } from "@/lib/validation";

/**
 * Checks a `yyyy-MM-dd` string is a real calendar date that isn't after today.
 * @param value date as submitted by `<input type="date">`
 */
function isPastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return false;
  }
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return value <= today;
}

export const employeeSchema = z
  .object({
    firstName: requiredText("Podaj imię."),
    lastName: requiredText("Podaj nazwisko."),
    sex: z.enum(Sex, "Wybierz płeć."),
    pesel: optionalText.refine((value) => value === null || isValidPesel(value), "Nieprawidłowy numer PESEL."),
    idDocumentName: optionalText,
    idDocumentNumber: optionalText,
    birthDate: optionalText,
    city: requiredText("Podaj miejscowość."),
    street: optionalText,
    buildingNumber: requiredText("Podaj numer budynku."),
    flatNumber: optionalText,
    position: requiredText("Podaj stanowisko."),
    workDescription: requiredText("Podaj opis pracy."),
  })
  .superRefine((employee, ctx) => {
    if (employee.pesel) {
      return;
    }
    if (!employee.idDocumentName) {
      ctx.addIssue({ code: "custom", path: ["idDocumentName"], message: "Bez numeru PESEL podaj nazwę dokumentu tożsamości." });
    }
    if (!employee.idDocumentNumber) {
      ctx.addIssue({ code: "custom", path: ["idDocumentNumber"], message: "Bez numeru PESEL podaj serię i numer dokumentu." });
    }
    if (!employee.birthDate || !isPastDate(employee.birthDate)) {
      ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Bez numeru PESEL podaj prawidłową datę urodzenia." });
    }
    // zod skips refinements once a field fails; run anyway so the form shows every error at once.
  }, { when: (payload) => typeof payload.value === "object" && payload.value !== null })
  // The form prints either the PESEL or the ID document, so drop whichever isn't used.
  .transform((employee) =>
    employee.pesel ? { ...employee, idDocumentName: null, idDocumentNumber: null, birthDate: null } : employee,
  );

export type EmployeeInput = z.infer<typeof employeeSchema>;

const DUPLICATE_PESEL: ServiceResult = { ok: false, errors: { pesel: "Pracownik z tym numerem PESEL już istnieje." } };

/** The company's employees that aren't deleted, by last and first name. */
export function listEmployees(ctx: CompanyContext) {
  return db.employee.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

/** An employee of the context's company that isn't deleted. */
export async function getEmployee(ctx: CompanyContext, id: string) {
  const employee = await db.employee.findFirst({ where: { id, companyId: ctx.companyId, deletedAt: null } });
  if (!employee) {
    throw new NotFoundError();
  }
  return employee;
}

/** Creates an employee in the context's company. */
export function createEmployee(ctx: CompanyContext, input: EmployeeInput): Promise<ServiceResult> {
  return saveUniquePesel(() => db.employee.create({ data: { ...input, companyId: ctx.companyId } }));
}

/** Updates an employee of the context's company that isn't deleted. */
export async function updateEmployee(ctx: CompanyContext, id: string, input: EmployeeInput): Promise<ServiceResult> {
  await getEmployee(ctx, id);
  return saveUniquePesel(() => db.employee.update({ where: { id }, data: input }));
}

/** Soft deletes an employee of the context's company. Their referrals keep their snapshots. */
export async function deleteEmployee(ctx: CompanyContext, id: string): Promise<void> {
  const { count } = await db.employee.updateMany({
    where: { id, companyId: ctx.companyId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (count === 0) {
    throw new NotFoundError();
  }
}

// The PESEL is the only unique column besides the id, so a unique violation means a duplicate PESEL.
async function saveUniquePesel(save: () => Promise<unknown>): Promise<ServiceResult> {
  try {
    await save();
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return DUPLICATE_PESEL;
    }
    throw error;
  }
}
