import { describe, expect, test } from "vitest";

import { isValidNip, isValidPesel, isValidPostalCode, normalizeNip } from "./validation";

describe("NIP", () => {
  test("accepts the synthetic seed NIPs", () => {
    for (const nip of ["5210001126", "5830002226", "6750003336"]) {
      expect(isValidNip(nip)).toBe(true);
    }
  });

  test("accepts a NIP typed with separators once normalized", () => {
    expect(normalizeNip("521-000-11 26")).toBe("5210001126");
    expect(isValidNip(normalizeNip("521-000-11-26"))).toBe(true);
  });

  test("rejects a wrong check digit", () => {
    expect(isValidNip("5210001127")).toBe(false);
  });

  test("rejects a NIP whose checksum remainder is 10", () => {
    // 9 * 6 = 54 and 54 % 11 = 10, so no last digit can match.
    expect(isValidNip("9000000000")).toBe(false);
    expect(isValidNip("9000000001")).toBe(false);
  });

  test("rejects wrong length or non-digits", () => {
    expect(isValidNip("521000112")).toBe(false);
    expect(isValidNip("52100011260")).toBe(false);
    expect(isValidNip("521000112a")).toBe(false);
  });
});

describe("postal code", () => {
  test("accepts NN-NNN only", () => {
    expect(isValidPostalCode("50-001")).toBe(true);
    expect(isValidPostalCode("50001")).toBe(false);
    expect(isValidPostalCode("5-0001")).toBe(false);
    expect(isValidPostalCode(" 50-001")).toBe(false);
  });
});

describe("PESEL", () => {
  test("accepts valid PESELs, including a check digit of 0", () => {
    expect(isValidPesel("84051712374")).toBe(true);
    expect(isValidPesel("44051401359")).toBe(true);
    expect(isValidPesel("90010100030")).toBe(true);
  });

  test("rejects a wrong check digit", () => {
    expect(isValidPesel("84051712375")).toBe(false);
  });

  test("rejects wrong length or non-digits", () => {
    expect(isValidPesel("8405171237")).toBe(false);
    expect(isValidPesel("840517123745")).toBe(false);
    expect(isValidPesel("8405171237a")).toBe(false);
    expect(isValidPesel("")).toBe(false);
  });
});
