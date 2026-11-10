import { z } from "zod";

import type { Company, Employee } from "@/generated/prisma/client";
import { ExamType, RiskCategory, Sex } from "@/generated/prisma/enums";
import type { EmploymentStatus, ReferralSnapshot } from "@/lib/referral-pdf/snapshot";

// No server-only imports here: the referral form uses defaultEmploymentStatus in the browser.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const text = z.string().min(1);

// `satisfies` makes typecheck fail if this schema and the renderer's type drift apart.
export const referralSnapshotSchema = z.object({
  examType: z.enum(ExamType),
  employmentStatus: z.enum(["EMPLOYED", "TAKING_UP_WORK"]),
  issuePlace: text,
  issueDate: isoDate,
  employer: z.object({
    name: text,
    nip: text,
    street: z.string().nullable(),
    buildingNumber: text,
    flatNumber: z.string().nullable(),
    postalCode: text,
    city: text,
  }),
  employee: z.object({
    firstName: text,
    lastName: text,
    sex: z.enum(Sex),
    pesel: z.string().nullable(),
    idDocumentName: z.string().nullable(),
    idDocumentNumber: z.string().nullable(),
    birthDate: isoDate.nullable(),
    city: text,
    street: z.string().nullable(),
    buildingNumber: text,
    flatNumber: z.string().nullable(),
  }),
  position: text,
  workDescription: text,
  factors: z.array(z.object({ category: z.enum(RiskCategory), name: text, exposureLevel: z.string().nullable() })).min(1),
}) satisfies z.ZodType<ReferralSnapshot>;

const WARSAW_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * The calendar date in Poland as `yyyy-MM-dd`. The container clock runs in UTC, so a referral
 * created late in the evening would otherwise get tomorrow's date.
 */
export function warsawDate(date: Date): string {
  return WARSAW_DATE.format(date);
}

/** Pre-employment exams are for people taking up work; periodic and follow-up exams for employees. */
export function defaultEmploymentStatus(examType: ExamType): EmploymentStatus {
  return examType === ExamType.PRE_EMPLOYMENT ? "TAKING_UP_WORK" : "EMPLOYED";
}

export type SnapshotParts = {
  company: Pick<Company, "name" | "nip" | "street" | "buildingNumber" | "flatNumber" | "postalCode" | "city">;
  employee: Pick<
    Employee,
    "firstName" | "lastName" | "sex" | "pesel" | "idDocumentName" | "idDocumentNumber" | "birthDate" | "city" | "street" | "buildingNumber" | "flatNumber"
  >;
  input: { examType: ExamType; employmentStatus: EmploymentStatus; position: string; workDescription: string };
  /** In the order the form lists them; the snapshot regroups them by category. */
  factors: { category: RiskCategory; name: string; exposureLevel: string | null }[];
  issueDate: string;
};

/**
 * Copies everything the form prints into a snapshot. The place of issue is the company's town.
 * Factors are ordered by category I–V, keeping their order within a category.
 */
export function buildSnapshot({ company, employee, input, factors, issueDate }: SnapshotParts): ReferralSnapshot {
  const categoryOrder = Object.values(RiskCategory);
  return {
    examType: input.examType,
    employmentStatus: input.employmentStatus,
    issuePlace: company.city,
    issueDate,
    employer: {
      name: company.name,
      nip: company.nip,
      street: company.street,
      buildingNumber: company.buildingNumber,
      flatNumber: company.flatNumber,
      postalCode: company.postalCode,
      city: company.city,
    },
    employee: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      sex: employee.sex,
      pesel: employee.pesel,
      idDocumentName: employee.idDocumentName,
      idDocumentNumber: employee.idDocumentNumber,
      birthDate: employee.birthDate,
      city: employee.city,
      street: employee.street,
      buildingNumber: employee.buildingNumber,
      flatNumber: employee.flatNumber,
    },
    position: input.position,
    workDescription: input.workDescription,
    factors: factors
      .map(({ category, name, exposureLevel }) => ({ category, name, exposureLevel }))
      .toSorted((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)),
  };
}
