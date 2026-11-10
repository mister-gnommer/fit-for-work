import type { Role, Sex } from "@/generated/prisma/enums";

// Polish UI labels for enum values. Later enums (exam type, status, risk category) go here too.
export const roleLabels: Record<Role, string> = {
  TELEMEDI: "Telemedi",
  ADMIN: "Administrator",
  OPERATOR: "Operator",
};

export const sexLabels: Record<Sex, string> = {
  FEMALE: "Kobieta",
  MALE: "Mężczyzna",
};
