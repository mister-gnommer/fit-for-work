import { describe, expect, test } from "vitest";

import { canCreateUser, canDeleteUser, canSetPassword, startPath, type Account } from "./permissions";

const telemedi: Account = { id: "t", role: "TELEMEDI", companyId: null };
const otherTelemedi: Account = { id: "t2", role: "TELEMEDI", companyId: null };
const admin: Account = { id: "a", role: "ADMIN", companyId: "c1" };
const operator: Account = { id: "o", role: "OPERATOR", companyId: "c1" };
const colleague: Account = { id: "o2", role: "OPERATOR", companyId: "c1" };
const foreignOperator: Account = { id: "x", role: "OPERATOR", companyId: "c2" };
const foreignAdmin: Account = { id: "xa", role: "ADMIN", companyId: "c2" };

describe("canCreateUser", () => {
  test.each([
    [telemedi, "ADMIN", true],
    [telemedi, "OPERATOR", true],
    [telemedi, "TELEMEDI", false],
    [admin, "OPERATOR", true],
    [admin, "ADMIN", false],
    [operator, "OPERATOR", false],
  ] as const)("%o creating %s → %s", (actor, role, expected) => {
    expect(canCreateUser(actor, role)).toBe(expected);
  });
});

describe("canSetPassword", () => {
  test.each([
    [telemedi, admin, true],
    [telemedi, foreignOperator, true],
    [telemedi, otherTelemedi, false],
    [admin, operator, true],
    [admin, admin, false],
    [admin, foreignOperator, false],
    [admin, telemedi, false],
    [operator, operator, false],
    [operator, colleague, false],
  ])("%o → %o: %s", (actor, target, expected) => {
    expect(canSetPassword(actor, target)).toBe(expected);
  });
});

describe("canDeleteUser", () => {
  test.each([
    [telemedi, admin, true],
    [telemedi, foreignAdmin, true],
    [telemedi, otherTelemedi, false],
    [admin, operator, true],
    [admin, admin, false],
    [admin, foreignOperator, false],
    [operator, operator, true],
    [operator, colleague, false],
    [operator, admin, false],
  ])("%o → %o: %s", (actor, target, expected) => {
    expect(canDeleteUser(actor, target)).toBe(expected);
  });
});

test("start page depends on role", () => {
  expect(startPath("TELEMEDI")).toBe("/companies");
  expect(startPath("ADMIN")).toBe("/users");
  expect(startPath("OPERATOR")).toBe("/users");
});
