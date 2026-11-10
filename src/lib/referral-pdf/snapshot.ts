export type ExamType = "PRE_EMPLOYMENT" | "PERIODIC" | "FOLLOW_UP";
export type EmploymentStatus = "EMPLOYED" | "TAKING_UP_WORK";
export type Sex = "FEMALE" | "MALE";
export type RiskCategory = "PHYSICAL" | "DUSTS" | "CHEMICAL" | "BIOLOGICAL" | "OTHER";

/** Everything printed on a referral, frozen when the referral is created. Nullable fields mirror nullable DB columns. */
export type ReferralSnapshot = {
  examType: ExamType;
  employmentStatus: EmploymentStatus;
  issuePlace: string;
  /** yyyy-MM-dd */
  issueDate: string;
  employer: {
    name: string;
    nip: string;
    street: string | null;
    buildingNumber: string;
    flatNumber: string | null;
    postalCode: string;
    city: string;
  };
  employee: {
    firstName: string;
    lastName: string;
    sex: Sex;
    pesel: string | null;
    idDocumentName: string | null;
    idDocumentNumber: string | null;
    /** yyyy-MM-dd */
    birthDate: string | null;
    city: string;
    street: string | null;
    buildingNumber: string;
    flatNumber: string | null;
  };
  position: string;
  workDescription: string;
  factors: { category: RiskCategory; name: string; exposureLevel: string | null }[];
};
