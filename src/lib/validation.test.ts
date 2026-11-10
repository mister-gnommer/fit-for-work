import { describe, expect, test } from "vitest";

import { isValidNip, isValidPostalCode, normalizeNip } from "./validation";

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
