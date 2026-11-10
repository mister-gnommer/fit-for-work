## Grilling ledger

Decision record from the planning interview.

- ✅ = final answer explicitly chosen by the user.
- ◐ = final outcome derived from a conditional answer or accepted follow-up.
- ↪ = an earlier answer that was later corrected or superseded.

### Round 1: architecture and core mechanics (2026-11-10)

#### Q1: App architecture

- ✅ **A: App Router, with server components for reading and Server Actions for writing. No separate API. Company scoping lives in one helper.**
- B: App Router with REST route handlers and client-side fetching.
- C: Next.js frontend plus a separate backend service.

#### Q2: Auth implementation

- ✅ **A: Better Auth with its Prisma adapter.**
- B: Auth.js Credentials provider.
- C: Our own sessions with argon2 or bcrypt.

#### Q3: Where the position (*stanowisko*) comes from

- ✅ **A: A field on the employee record. It's copied onto the referral, where you can edit it, and then frozen.**
- B: The template's name is used as the position.
- C: It's typed in on each referral.

#### Q4: Employees without a PESEL

- ✅ **A: PESEL is optional. If it's missing, document type, number and date of birth are required. The PESEL checksum is validated.**
- B: PESEL is always required.

#### Q5: Status changes

- ✅ **A: Telemedi picks any status from a dropdown, with no transition rules.** Proper transition rules will come with the Telemedi API integration. This is listed in `SCOPE-CUTS.md`.
- B: Only forward moves are allowed, and cancelling is possible from any non-final status.

#### Q6: PDF generation

The question was reopened: the referral has to look pixel-perfect. It's asked again in Round 2.

- A: `@react-pdf/renderer`
- B: `pdf-lib`, placing text by coordinates
- C: A print-styled HTML page and the browser's "Save as PDF"

### Round 2: PDF generation (2026-11-10)

#### Q6 (asked again): PDF generation

The official form isn't a fixed-field form. Each risk-factor category gets a single empty line, so the content has to flow, and laying text over an image of the form won't fit.

- ✅ **A: An HTML/CSS copy of the official form, turned into a PDF by headless Chromium through Playwright. The font is a Times-like serif with Polish characters (Liberation Serif or Tinos).**
- B: `@react-pdf/renderer`.
- C: `pdf-lib` drawing text by coordinates over an image of the form.

### Round 3: form fields missing from the data model (2026-11-10)

#### Q9: Work description

- ✅ **A: A free-text field on the employee, next to the position. It's copied onto the referral, where it can be edited.**
- B: It's typed in on each referral only.

#### Q10: "Employed" vs. "taking up work"

- ✅ **A: Set from the exam type: pre-employment means "taking up work", periodic and follow-up mean "employed". It can be overridden on the referral form.**
- B: It's always picked by hand.

#### Q11: Place and date of issue

- ✅ **A: The company's town and the date the referral is created.**
- B: A separate "place of issue" field on the company.

#### Q12: Employee home address

- ✅ **A: Required on the employee: town, street and building number. The flat number is optional.**

### Round 4: how faithful the PDF must be (2026-11-10)

#### Q13: Pixel-perfect or faithful copy

§ 4 ust. 2 of the regulation lists the required content. § 4 ust. 3 points to Annex 3a as the template ("wzór"). Nothing sets the layout, and companies use different-looking versions.

- A: A pixel-perfect copy of the reference.
- ✅ **B: A faithful copy. The wording, the order of the fields, the footnotes, the categories, the factor count, the signature line and the explanatory notes all match. The look is close (serif font, A4), but positions aren't exact. The visual reference is `docs/research/womp-referral-form.pdf`.**

### Round 5: data model review (2026-11-10)

#### Q14: Language of enum values

- ✅ **A: Values in English, with Polish labels (official wording) in one labels file. `pesel` and `nip` keep their Polish names.**
- B: Values in Polish.
- C: All domain names in Polish, including entities and fields.

#### Q15: Reusing a deleted user's email

- ✅ **It can't be reused, because Better Auth keeps a plain unique index on `email`. Only the PESEL uniqueness rule ignores deleted records.**

#### Q16: NIP

- ✅ **Required and checksum-validated.**

#### Q17: Street

- ✅ **Optional, for both companies and employees.**

#### Q18: Human-readable referral number

- ✅ **None for now. It's listed as an open product question in README.**

#### Q7: Demo data

- ✅ **A: The seed adds synthetic demo data: two or three companies with an admin, an operator, employees, templates and referrals in different statuses. Login details are in the README.**
- B: Only the required seed.
- ◐ **Narrowed later: one presentation company gets all the demo data (8 employees, one of them without a PESEL, plus templates and 5 referrals). The other two companies have only an admin, so the switcher has something to show. The data is in `docs/seed/`.**

#### Q8: Test stack

- ✅ **A: Vitest for unit and integration tests. Integration tests run on a real temporary SQLite database with migrations applied, with no mocks. Playwright runs the end-to-end tests.**
- B: Jest instead of Vitest.
