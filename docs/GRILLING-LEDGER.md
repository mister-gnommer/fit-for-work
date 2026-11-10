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

#### Q7: Demo data

- ✅ **A: The seed adds synthetic demo data: two or three companies with an admin, an operator, employees, templates and referrals in different statuses. Login details are in the README.**
- B: Only the required seed.

#### Q8: Test stack

- ✅ **A: Vitest for unit and integration tests. Integration tests run on a real temporary SQLite database with migrations applied, with no mocks. Playwright runs the end-to-end tests.**
- B: Jest instead of Vitest.
