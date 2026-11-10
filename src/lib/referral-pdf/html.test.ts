import { describe, expect, test } from "vitest";

import { renderReferralHtml } from "./html";
import type { ReferralSnapshot } from "./snapshot";
import { testSnapshot } from "./test-snapshot";

/** Contents of every struck span, in document order. */
function struck(html: string): string[] {
  return [...html.matchAll(/<span class="strike">([^<]*)<\/span>/g)].map((match) => match[1]);
}

/** Inner HTML of a category's factor list, e.g. "II." for dusts. */
function categoryItems(html: string, no: string): string {
  const match = html.match(new RegExp(`<div class="no">${no}</div>[\\s\\S]*?<div class="items">(.*?)</div>`));
  if (!match) {
    throw new Error(`category ${no} not found`);
  }
  return match[1];
}

/** Text of the PESEL field. */
function identityField(html: string): string | undefined {
  return html.match(/nr PESEL<sup>\*\*\)<\/sup> <span class="fill">(.*?)<\/span>/)?.[1];
}

function render(overrides: Partial<ReferralSnapshot>): string {
  return renderReferralHtml({ ...testSnapshot, ...overrides });
}

describe("strike-throughs", () => {
  test("female taking up work, pre-employment exam", () => {
    const html = render({ examType: "PRE_EMPLOYMENT", employmentStatus: "TAKING_UP_WORK" });

    expect(struck(html)).toEqual([
      "/okresowe",
      "/kontrolne",
      "Pana",
      "/",
      "zamieszkałego",
      "/",
      "zatrudnionego",
      "/zatrudnioną",
      "podejmującego",
      "/",
      "/stanowisk",
    ]);
  });

  test("male already employed, periodic exam", () => {
    const html = render({
      examType: "PERIODIC",
      employmentStatus: "EMPLOYED",
      employee: { ...testSnapshot.employee, sex: "MALE" },
    });

    expect(struck(html)).toEqual([
      "wstępne",
      "/",
      "/kontrolne",
      "/Panią",
      "/zamieszkałą",
      "/zatrudnioną",
      "podejmującego",
      "/podejmującą",
      "/stanowisk",
    ]);
  });
});

describe("identity", () => {
  test("prints the PESEL when there is one", () => {
    expect(identityField(render({}))).toBe("44051401359");
  });

  test("prints the ID document and birth date without a PESEL", () => {
    const html = render({
      employee: {
        ...testSnapshot.employee,
        pesel: null,
        idDocumentNumber: "AB 1234567",
        idDocumentName: "paszport",
        birthDate: "1990-01-31",
      },
    });

    expect(identityField(html)).toBe("AB 1234567, paszport, data urodzenia: 1990-01-31");
  });
});

describe("risk factors", () => {
  test("groups factors by category, adds exposure levels and counts them", () => {
    const html = render({});

    expect(categoryItems(html, "I.")).toBe(
      '<span class="factor">Hałas – LEX,8h = 62 dB</span>' +
        '<span class="factor">oświetlenie sztuczne</span>' +
        '<span class="factor">mikroklimat umiarkowany</span>',
    );
    expect(categoryItems(html, "II.")).toBe("");
    expect(categoryItems(html, "III.")).toBe('<span class="factor">Toner do drukarek – poniżej NDS</span>');
    expect(categoryItems(html, "IV.")).toBe("");
    expect(categoryItems(html, "V.").match(/class="factor"/g)).toHaveLength(4);
    expect(html).toContain('<div class="box">8</div>');
  });

  test("no factors leaves every category empty and the count at 0", () => {
    const html = render({ factors: [] });

    for (const no of ["I.", "II.", "III.", "IV.", "V."]) {
      expect(categoryItems(html, no)).toBe("");
    }
    expect(html).toContain('<div class="box">0</div>');
  });
});

test("an employer without a street uses the town in its address line", () => {
  const html = render({ employer: { ...testSnapshot.employer, street: "", flatNumber: null } });

  expect(html).toContain("Łódź 100<br>90-001 Łódź");
});

test("user text is escaped", () => {
  const html = render({ workDescription: `<b>Kierowca</b> & "magazynier"` });

  expect(html).toContain("&lt;b&gt;Kierowca&lt;/b&gt; &amp; &quot;magazynier&quot;");
  expect(html).not.toContain("<b>");
});
