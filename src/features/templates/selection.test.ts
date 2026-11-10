import { describe, expect, test } from "vitest";

import { readFactorSelection } from "./selection";

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) {
    data.append(key, value);
  }
  return data;
}

describe("readFactorSelection", () => {
  test("reads checked factors with trimmed exposure levels, empty ones as null", () => {
    const selection = readFactorSelection(
      form([
        ["name", "Magazynier"],
        ["factor-a", "on"],
        ["exposure-a", "  85 dB  "],
        ["factor-b", "on"],
        ["exposure-b", "   "],
      ]),
    );
    expect(selection).toEqual([
      { riskFactorId: "a", exposureLevel: "85 dB" },
      { riskFactorId: "b", exposureLevel: null },
    ]);
  });

  test("ignores unchecked factors even with an exposure level filled in", () => {
    expect(readFactorSelection(form([["exposure-a", "85 dB"], ["factor-b", "on"]]))).toEqual([{ riskFactorId: "b", exposureLevel: null }]);
  });

  test("returns each factor once and an empty list when nothing is checked", () => {
    expect(readFactorSelection(form([["factor-a", "on"], ["factor-a", "on"]]))).toEqual([{ riskFactorId: "a", exposureLevel: null }]);
    expect(readFactorSelection(form([["name", "Pusty"]]))).toEqual([]);
  });
});
