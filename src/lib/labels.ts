import type { RiskCategory, Role, Sex } from "@/generated/prisma/enums";

// Polish UI labels for enum values. Later enums (exam type, status) go here too.
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

export const sexLabels: Record<Sex, string> = {
  FEMALE: "Kobieta",
  MALE: "Mężczyzna",
};
