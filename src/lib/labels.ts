import type { ExamType, ReferralStatus, RiskCategory, Role, Sex } from "@/generated/prisma/enums";
import type { EmploymentStatus } from "@/lib/referral-pdf/snapshot";

// Polish UI labels for enum values.
export const roleLabels: Record<Role, string> = {
  TELEMEDI: "Telemedi",
  ADMIN: "Administrator",
  OPERATOR: "Operator",
};

// Official wording of the referral form's categories I–V.
export const riskCategoryLabels: Record<RiskCategory, string> = {
  PHYSICAL: "Czynniki fizyczne",
  DUSTS: "Pyły",
  CHEMICAL: "Czynniki chemiczne",
  BIOLOGICAL: "Czynniki biologiczne",
  OTHER: "Inne czynniki, w tym niebezpieczne",
};

// The form numbers the categories I–V.
export const riskCategoryNumerals: Record<RiskCategory, string> = {
  PHYSICAL: "I",
  DUSTS: "II",
  CHEMICAL: "III",
  BIOLOGICAL: "IV",
  OTHER: "V",
};

export const sexLabels: Record<Sex, string> = {
  FEMALE: "Kobieta",
  MALE: "Mężczyzna",
};

export const examTypeLabels: Record<ExamType, string> = {
  PRE_EMPLOYMENT: "Wstępne",
  PERIODIC: "Okresowe",
  FOLLOW_UP: "Kontrolne",
};

export const employmentStatusLabels: Record<EmploymentStatus, string> = {
  EMPLOYED: "Pracownik zatrudniony",
  TAKING_UP_WORK: "Osoba podejmująca pracę",
};

export const referralStatusLabels: Record<ReferralStatus, string> = {
  CREATED: "Utworzone",
  IN_PROGRESS: "W realizacji",
  CONFIRMED: "Potwierdzone",
  DONE: "Zrealizowane",
  CANCELLED: "Anulowane",
};
