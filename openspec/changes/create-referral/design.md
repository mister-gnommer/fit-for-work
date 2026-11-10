# Design

## Context

Everything a referral needs is on `main`:

| Piece | Where |
|---|---|
| Company context | `requireCompanyContext()` |
| Employees | `getEmployee(ctx, id)`, `listEmployees(ctx)`. Address and identity fields match the snapshot's names. |
| Risk factors | `listRiskFactors(companyId)`: predefined plus own |
| PDF renderer | `renderReferralPdf(snapshot)` in `src/lib/referral-pdf/`, with the `ReferralSnapshot` type and `testSnapshot`. Its design left validating the snapshot at write time and adding the route to this change. |

Form helpers, `Field`, the feature layout, and the integration and e2e patterns come from earlier changes.

The installed Next.js docs list `playwright` among the packages Next.js keeps out of server bundles, so the route needs no config change.

`manage-referral-templates` is running in parallel. It touches the schema, `labels.ts` and the header.

## Goals / Non-Goals

**Goals:**
- the shortest working flow from choosing an employee to downloading the PDF
- a snapshot that's validated when written and parsed again when read
- no type assertions

**Non-Goals:**
- templates (6b)
- the referral list and statuses (change 7)
- editing or deleting referrals
- sharing a browser between PDF renders
- a picker component shared with templates

## Decisions

### Two-step form without client fetching

`/referrals/new` shows a `GET` form with a native employee select. Submitting it reloads the page as `/referrals/new?employeeId=…`. The server then loads the employee with `getEmployee(ctx, id)` and renders the full form with the position and work description pre-filled.

**Alternative: one page that fetches employee data on select.** Rejected: it needs client data fetching and an extra endpoint for little gain.

### Form state and field names

`referral-form.tsx` is a client component using `useActionState`, like the other forms. It holds one piece of state:
- The employment status follows `defaultEmploymentStatus(examType)` until the user changes the status select by hand.
- After that, the user's choice sticks.

The server never derives the status itself: it saves the value that was posted.

**Factors:** one checkbox per factor, `name="factorIds" value={id}`, plus a text input `exposure:<id>`. The action reads them with `formData.getAll("factorIds")` and `formData.get("exposure:" + id)`. After a validation error, the kept values (`FormState.values`) include the selected IDs and exposures, so checkboxes and exposure inputs re-render as entered. To make that possible, `FormState.values` gets one optional `factorIds` field in `src/lib/forms.ts` (a small extension).

### Input schema and service checks

`referralInputSchema` (zod):

| Field | Rule |
|---|---|
| `examType` | Prisma enum |
| `employmentStatus` | `EMPLOYED` or `TAKING_UP_WORK` |
| `position`, `workDescription` | `requiredText` with no length limit, matching the employee form |
| `deadline` | `yyyy-MM-dd`, a real date, not before `warsawDate(now)` |
| `factors` | non-empty array of `{ id, exposureLevel: optionalText, max 200 }` with unique IDs |

`createReferral(ctx, employeeId, input, now = new Date())`:
1. Loads the employee with `getEmployee` (`NotFoundError` if it's another company's or deleted) and the company.
2. Loads the factors with `findMany({ id: { in: ids }, deletedAt: null, OR: [{ companyId: null }, { companyId: ctx.companyId }] })`. If fewer come back than were asked for, it returns the form error "Lista czynników się zmieniła. Odśwież formularz i wybierz je ponownie." No referral is created.
3. Builds and validates the snapshot.
4. Creates the referral with `createdById: ctx.user.id`, `examType`, `deadline`, `snapshot`, and status defaulting to `CREATED`.
5. Returns the new ID so the action can redirect to `/referrals/[id]`.

`now` is a parameter so tests can fix the date.

### Snapshot: a pure builder and a schema

`src/features/referrals/snapshot.ts`:
- **`buildSnapshot({ company, employee, input, factors, issueDate })`** is pure. It copies the employer and employee columns, takes the position, work description, exam type and employment status from the input, and sets `issuePlace = company.city` and `issueDate`. Factors are `{ category, name, exposureLevel }`, ordered by category (I–V), then by the order the form lists them.
- **`referralSnapshotSchema`** is a zod object declared `satisfies z.ZodType<ReferralSnapshot>`, so it can't drift from the renderer's type. The service parses the built snapshot with it before writing. `getReferral` parses the stored JSON with it again, which gives a typed `ReferralSnapshot` without an `as` cast.
- **`warsawDate(date)`** returns `yyyy-MM-dd` in Europe/Warsaw, using `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" })`. The container runs in UTC, so the time zone must be explicit.
- **`defaultEmploymentStatus(examType)`** returns "taking up work" for pre-employment exams and "employed" otherwise. It's shared by the form and the tests.

### Schema

- Enums: `ExamType { PRE_EMPLOYMENT PERIODIC FOLLOW_UP }` and `ReferralStatus { CREATED IN_PROGRESS CONFIRMED DONE CANCELLED }`.
- `Referral { id, companyId, employeeId, createdById, examType, status @default(CREATED), deadline String /* yyyy-MM-dd */, snapshot Json, createdAt, updatedAt, deletedAt? }`, with `@@index([companyId])`.
- Relations to `Company`, `Employee` and `User` all use `onDelete: Restrict`, since nothing is hard deleted.
- `deadline` is a string like the employee's `birthDate`, so no time zone can shift it.
- Employment status lives only in the snapshot: it's printed but never filtered on, so it needs no column or Prisma enum. Its type comes from the snapshot module.

### Pages and route

| Path | What it does |
|---|---|
| `/referrals/new` | Step 1 (no `employeeId`) or the form (with `employeeId`). Calls `requireCompanyContext()`. If the company has no employees, it shows a message with a link to `/employees/new`. |
| `/referrals/[id]` | Summary: employee name, exam type, employment status, deadline, status label, number of factors, date of issue, and a "Pobierz PDF" link. |
| `/referrals/[id]/pdf` | `GET` route handler. Calls `requireCompanyContext()` (logged out → redirect to `/login`), then `getReferral(ctx, id)`. A `NotFoundError` becomes a plain 404. The response is `renderReferralPdf(snapshot)` as `application/pdf` with `Content-Disposition: attachment; filename="skierowanie-<issueDate>.pdf"`, ASCII-only. |

The header gets "Nowe skierowanie", shown under the same condition as the other company links. `labels.ts` gets `examTypeLabels`, `employmentStatusLabels` ("Pracownik zatrudniony" / "Osoba podejmująca pracę") and `referralStatusLabels`.

### Tests

- **Unit** (`snapshot.test.ts`):
  - `warsawDate` across midnight: 22:30 UTC in winter is the next day in Warsaw.
  - `defaultEmploymentStatus`
  - `buildSnapshot`: PESEL vs. ID-document employees, factor order by category, exposure `null` when empty, issue place from the company.
  - `referralSnapshotSchema` accepts `testSnapshot` and rejects a factor with an unknown category.
- **One integration test** (`referrals.integration.test.ts`):
  - create a referral with a predefined factor and an own factor
  - the stored snapshot and the status `CREATED`
  - editing the employee, renaming and deleting the factor afterwards leaves `getReferral(…).snapshot` unchanged
  - another company's employee or factor, or a deleted employee or factor, is rejected
  - `getReferral` from another company gives `NotFoundError`
  - a deadline before the fixed `now` is rejected
- **One e2e test** (`tests/e2e/referral.spec.ts`, the second of five): an operator picks a demo employee, checks two factors with one exposure level, sets a deadline, saves, sees the summary, and the PDF link returns `200` with `application/pdf` and a body starting with `%PDF`.

## Risks / Trade-offs

- [PDF rendering takes about a second per download, with one browser launch each] → Accepted for the MVP, as `render-referral-pdf` decided.
- [Parallel schema and migration with templates] → Create the migration on an up-to-date `main`. If templates merge first, merge `main` and check the migration order and drift, as with the previous changes.
- [Two factor pickers, here and in templates] → 6b decides which one to keep when it adds template application.
- [The form posts all factors on every submit, including about 36 unchecked exposure inputs] → Negligible.
- [Snapshot schema and renderer type drifting apart] → `satisfies z.ZodType<ReferralSnapshot>` fails typecheck if they differ.

## Migration Plan

One additive migration (`create_referral`). Docker is checked once at the end (AGENTS.md), and the check must include downloading a PDF in the container: Chromium and fonts come from the `render-referral-pdf` image changes.
