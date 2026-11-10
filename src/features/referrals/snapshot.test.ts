import { describe, expect, test } from "vitest";

import { testSnapshot } from "@/lib/referral-pdf/test-snapshot";

import { buildSnapshot, defaultEmploymentStatus, referralSnapshotSchema, warsawDate, type SnapshotParts } from "./snapshot";

const parts: SnapshotParts = {
  company: { name: "Firma", nip: "5210001126", street: null, buildingNumber: "7", flatNumber: null, postalCode: "32-400", city: "Zalesie Górne" },
  employee: {
    firstName: "Adam",
    lastName: "Wójcik",
    sex: "MALE",
    pesel: null,
    idDocumentName: "paszport",
    idDocumentNumber: "AB1234567",
    birthDate: "1990-05-01",
    city: "Wrocław",
    street: "ul. Długa",
    buildingNumber: "3",
    flatNumber: "5",
  },
  input: { examType: "PRE_EMPLOYMENT", employmentStatus: "TAKING_UP_WORK", position: "Magazynier", workDescription: "Kompletacja zamówień." },
  factors: [
    { category: "OTHER", name: "Praca zmianowa", exposureLevel: null },
    { category: "PHYSICAL", name: "Hałas", exposureLevel: "85 dB" },
    { category: "OTHER", name: "Wózki widłowe", exposureLevel: null },
    { category: "CHEMICAL", name: "Toner", exposureLevel: null },
  ],
  issueDate: "2026-11-10",
};

describe("warsawDate", () => {
  test("uses the Polish calendar day, not UTC", () => {
    // 22:30 UTC in winter is 23:30 in Warsaw: still the same day there.
    expect(warsawDate(new Date("2026-11-10T22:30:00Z"))).toBe("2026-11-10");
    // 23:30 UTC is already the next day in Warsaw.
    expect(warsawDate(new Date("2026-11-10T23:30:00Z"))).toBe("2026-11-11");
    // Summer time: UTC+2.
    expect(warsawDate(new Date("2026-06-30T22:30:00Z"))).toBe("2026-07-01");
  });
});

test("employment status defaults from the exam type", () => {
  expect(defaultEmploymentStatus("PRE_EMPLOYMENT")).toBe("TAKING_UP_WORK");
  expect(defaultEmploymentStatus("PERIODIC")).toBe("EMPLOYED");
  expect(defaultEmploymentStatus("FOLLOW_UP")).toBe("EMPLOYED");
});

describe("buildSnapshot", () => {
  test("issues in the company's town and keeps the employee's document identity", () => {
    const snapshot = buildSnapshot(parts);
    expect(snapshot.issuePlace).toBe("Zalesie Górne");
    expect(snapshot.issueDate).toBe("2026-11-10");
    expect(snapshot.employee).toMatchObject({ pesel: null, idDocumentName: "paszport", idDocumentNumber: "AB1234567", birthDate: "1990-05-01" });
    expect(referralSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  test("groups factors by category I–V, keeping their order within a category", () => {
    expect(buildSnapshot(parts).factors.map((factor) => factor.name)).toEqual(["Hałas", "Toner", "Praca zmianowa", "Wózki widłowe"]);
  });
});

describe("referralSnapshotSchema", () => {
  test("accepts the renderer's test snapshot", () => {
    expect(referralSnapshotSchema.parse(testSnapshot)).toEqual(testSnapshot);
  });

  test("rejects a snapshot without factors or with an unknown category", () => {
    expect(referralSnapshotSchema.safeParse({ ...testSnapshot, factors: [] }).success).toBe(false);
    const unknownCategory = { ...testSnapshot, factors: [{ category: "NOISE", name: "Hałas", exposureLevel: null }] };
    expect(referralSnapshotSchema.safeParse(unknownCategory).success).toBe(false);
  });
});
