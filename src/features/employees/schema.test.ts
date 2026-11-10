import { describe, expect, test } from "vitest";

import { fieldErrors } from "@/lib/forms";

import { employeeSchema } from "./service";

const base = {
  firstName: " Anna ",
  lastName: "Nowak",
  sex: "FEMALE",
  city: "Wrocław",
  street: "",
  buildingNumber: "4",
  flatNumber: "",
  position: "Magazynier",
  workDescription: "Praca w magazynie.",
};

const idDocument = { idDocumentName: "dowód osobisty", idDocumentNumber: "ABC123456", birthDate: "1976-11-02" };

function errorsFor(input: Record<string, string>) {
  const result = employeeSchema.safeParse(input);
  return result.success ? {} : fieldErrors(result.error);
}

describe("employeeSchema", () => {
  test("a PESEL clears the ID document fields and empty optionals become null", () => {
    const employee = employeeSchema.parse({ ...base, ...idDocument, pesel: "84051712374" });
    expect(employee).toMatchObject({
      firstName: "Anna",
      pesel: "84051712374",
      idDocumentName: null,
      idDocumentNumber: null,
      birthDate: null,
      street: null,
      flatNumber: null,
    });
  });

  test("without a PESEL, the ID document and date of birth are kept", () => {
    const employee = employeeSchema.parse({ ...base, ...idDocument, pesel: "" });
    expect(employee).toMatchObject({ pesel: null, ...idDocument });
  });

  test("without a PESEL, each missing ID document field gets an error", () => {
    expect(Object.keys(errorsFor({ ...base, pesel: "" })).sort()).toEqual(["birthDate", "idDocumentName", "idDocumentNumber"]);
  });

  test("ID document errors show together with other field errors", () => {
    expect(Object.keys(errorsFor({ ...base, position: "", pesel: "" })).sort()).toEqual(["birthDate", "idDocumentName", "idDocumentNumber", "position"]);
  });

  test("an invalid PESEL is an error on the PESEL", () => {
    expect(errorsFor({ ...base, pesel: "84051712375" })).toHaveProperty("pesel");
  });

  test("rejects a future or impossible date of birth", () => {
    const nextYear = `${new Date().getFullYear() + 1}-01-01`;
    for (const birthDate of [nextYear, "1990-02-30", "1990-13-01", "02.11.1976"]) {
      expect(errorsFor({ ...base, ...idDocument, birthDate })).toHaveProperty("birthDate");
    }
  });
});
