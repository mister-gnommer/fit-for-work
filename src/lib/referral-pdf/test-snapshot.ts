import type { ReferralSnapshot } from "./snapshot";

/** A typical synthetic referral for tests and manual rendering. */
export const testSnapshot: ReferralSnapshot = {
  examType: "PRE_EMPLOYMENT",
  employmentStatus: "TAKING_UP_WORK",
  issuePlace: "Łódź",
  issueDate: "2026-11-10",
  employer: {
    name: "Żółć i Wspólnicy Sp. z o.o.",
    nip: "5210001126",
    street: "ul. Piotrkowska",
    buildingNumber: "100",
    flatNumber: "4",
    postalCode: "90-001",
    city: "Łódź",
  },
  employee: {
    firstName: "Anna",
    lastName: "Kowalska-Ąęśćńź",
    sex: "FEMALE",
    pesel: "44051401359",
    idDocumentName: null,
    idDocumentNumber: null,
    birthDate: null,
    city: "Warszawa",
    street: "ul. Prosta",
    buildingNumber: "12",
    flatNumber: "34",
  },
  position: "Specjalista ds. testów",
  workDescription: "Praca biurowa przy komputerze, około 7 godzin dziennie.",
  factors: [
    { category: "PHYSICAL", name: "Hałas", exposureLevel: "LEX,8h = 62 dB" },
    { category: "PHYSICAL", name: "oświetlenie sztuczne", exposureLevel: null },
    { category: "PHYSICAL", name: "mikroklimat umiarkowany", exposureLevel: null },
    { category: "CHEMICAL", name: "Toner do drukarek", exposureLevel: "poniżej NDS" },
    { category: "OTHER", name: "Praca przy monitorze ekranowym", exposureLevel: "powyżej 4 godzin dziennie" },
    { category: "OTHER", name: "obciążenie wzroku", exposureLevel: null },
    { category: "OTHER", name: "pozycja siedząca", exposureLevel: null },
    { category: "OTHER", name: "stres", exposureLevel: null },
  ],
};
