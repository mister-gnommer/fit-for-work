# Referral template prototype

`referral.html` (self-contained, no JS, no external requests) -> `referral.pdf` (Chromium headless `--print-to-pdf`, A4, 2 pages).

## Faithful
- Wording, order, footnote markers (`*)` `**)` `***)` `****)`), the five categories I-V, total-count box, "(podpis pracodawcy)", and the full "Objaśnienia" page match Annex 3a. Word-level diff of reference PDF text vs. Dz.U. 2023 poz. 607 p. 28-29: no differences in form wording.
- Strike-throughs via `text-decoration: line-through`; page 2 forced onto a new page (`break-before: page`); count box + signature are kept together (`break-inside: avoid`) so long content moves them as a unit.

## Deviations
- Omitted: "Załącznik nr 3a", "WZÓR", the `13)` footnote and legislative footnote (an issued referral should not carry them).
- Dotted lines are underlines of the inline value, so they wrap with the text; no empty dotted lines are printed. A blank (unfilled) print would need min-height lines (not needed for the app).
- Empty categories (II, IV) show only the title, no dotted line (as on the paper form).
- Font: Liberation Serif fallback in this environment (Tinos not installed); metrics are the same family.
- Sample text fits one page at 11.5pt; the reference uses ~12pt. Not millimetre-matched.

## Field mapping (`data-field`)
`employer` (multi-line, `<br>`), `issuePlaceDate`, `examType` (also strike the other two), `salutationStruck` (strike Pana or Panią), `fullName`, `pesel` (no-PESEL variant: see HTML comment, use `idDocument`), `address`, `positions`, `workDescription`, `factors.physical|dust|chemical|biological|other` (each contains `.factor` items with `factor.name` and optional `factor.exposure`), `factorCount`.

Strike choices (not data-field, just class `strike`, to be generated from data): exam type (2 of 3), Pana/Panią, zamieszkałego/zamieszkałą, employed vs. taking up (whole pair struck vs. the gender form), stanowiska/stanowisk.

Factors flow as `name – exposure` separated by `;` and ending in `.` (CSS `::after`). `factorCount` = total number of `.factor` items across all five categories (sample: 3+0+1+0+4 = 8); compute it, do not hand-type.

## Open issues
- Sample PESEL 44051401359 is a well-known checksum-valid test number; swap if undesirable.
- Whether "employed" and "taking up work" may both be struck/unstruck is not specified; template assumes exactly one is kept.
- Multiple positions: `positions` is a single string; separators (e.g. ordered list per § 4 ust. 2 pkt 2) are up to the generator.
- Browser print dialog headers/footers are suppressed only with `page.pdf()` defaults (`displayHeaderFooter: false`); `preferCSSPageSize` should be set to honour `@page` margins.
