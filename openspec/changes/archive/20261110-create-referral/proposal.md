# Proposal

## Why

Issuing a referral is the product's core flow. It's the reason employees, risk factors and the PDF renderer exist, and all of those are on `main` now. This change lets HR fill in a referral, freeze it, and download the official form right away. Templates are being built in parallel (`manage-referral-templates`), so this change works without them: the operator picks the factors by hand, and applying a template becomes a small follow-up (6b).

## What Changes

- **Data:**
  - A `Referral` model with the `ExamType` and `ReferralStatus` enums: company, employee, creator, exam type, status (default `CREATED`), deadline, a frozen `snapshot`, timestamps and soft delete (per `docs/DATA-MODEL.md`).
- **New referral form** in two steps. The first step picks one of the company's employees. The second step shows the form with:
  - the exam type: pre-employment, periodic or follow-up
  - "employed" vs. "taking up work", set from the exam type and changeable
  - the position and work description, pre-filled from the employee and editable
  - the risk factors: predefined plus the company's own, grouped by the five categories, each with a checkbox and an optional exposure level
  - the deadline
- **Saving:**
  - The server checks everything again. The employee and the factors must belong to the company (predefined factors count) and must not be deleted. At least one factor is required. The deadline can't be in the past.
  - It builds the snapshot from the employer, the employee, the form and the factors, validates it with a schema, and stores it.
  - The place of issue is the company's town. The date of issue is the creation date in Polish time.
- **Right after creating it:**
  - A referral page shows a summary and "Pobierz PDF".
  - A download route renders the PDF from the snapshot with the existing `renderReferralPdf`.
- **Frozen:** editing the employee, the factors or the company later doesn't change an existing referral or its PDF.
- **Labels and navigation:**
  - Polish labels for exam types, employment status and referral statuses in `src/lib/labels.ts`.
  - A "Nowe skierowanie" header link.
- **E2E:** one new test, the second of five: log in, create a referral and download the PDF.
- **Plan:** `docs/notes.md` gets row 6b, `apply-referral-template`. It adds a template select that pre-fills factors and exposure levels on this form, and the demo referrals from `docs/seed/demo.json`, which refer to templates by name.

Out of scope:
- applying templates and the demo referrals (6b)
- the referral list, status changes and deleting referrals (change 7)
- editing a referral after it's created: referrals are frozen
- human-readable referral numbers (an open question in README)

## Capabilities

### New Capabilities

- `referral-creation`: the two-step referral form, input rules, building and freezing the snapshot, the issue place and date, company scoping, and downloading the PDF.

### Modified Capabilities

None. `referral-pdf` renders a snapshot exactly as it does now. Its "Self-contained rendering" requirement already covers rendering in the container.

## Impact

- **Prisma:** the `ExamType` and `ReferralStatus` enums and the `Referral` model, in one new migration. `Company`, `Employee` and `User` get back relations.
- **New code:**
  - `src/features/referrals/`: service, snapshot schema and builder, actions, form
  - the pages `/referrals/new` and `/referrals/[id]`
  - the route `/referrals/[id]/pdf`
- **Changed code:** `src/lib/labels.ts` and the `(app)` header.
- **No `next.config.ts` change:** Next.js 16.4 already keeps `playwright` out of server bundles (installed docs: `serverExternalPackages`).
- **Parallel work:** `manage-referral-templates` edits `schema.prisma`, `labels.ts` and the header, and adds a migration. Whoever merges second keeps both sides and checks the migration order. Both changes build a "factors by category with an exposure level" picker; 6b reconciles the two.
- **Docs:** `docs/notes.md` (rows 6 and 6b) and `docs/CONTEXT.md` project state.
