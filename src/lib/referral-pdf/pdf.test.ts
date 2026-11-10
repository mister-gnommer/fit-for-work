import { expect, test } from "vitest";

import { renderReferralPdf } from "./pdf";
import type { ReferralSnapshot } from "./snapshot";
import { testSnapshot } from "./test-snapshot";

/** Page count from the PDF's page tree, which Chromium writes uncompressed; the root node has the largest count. */
function pageCount(pdf: Buffer): number {
  const counts = [...pdf.toString("latin1").matchAll(/\/Count (\d+)/g)].map((match) => Number(match[1]));
  return Math.max(...counts);
}

test("renders the form and its notes as an A4 PDF, flowing long content onto more pages", { timeout: 30_000 }, async () => {
  const typical = await renderReferralPdf(testSnapshot);
  const long = await renderReferralPdf({
    ...testSnapshot,
    workDescription: "Obsługa wózka widłowego i prace magazynowe w systemie zmianowym. ".repeat(40),
    factors: Array.from({ length: 60 }, (_, i): ReferralSnapshot["factors"][number] => ({
      category: "OTHER",
      name: `czynnik uciążliwy numer ${i + 1}`,
      exposureLevel: "powyżej 4 godzin dziennie",
    })),
  });

  expect(typical.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pageCount(typical)).toBe(2);
  expect(pageCount(long)).toBeGreaterThan(2);
});
