# Design

## Context

This change follows the patterns `accounts-and-company-access` sets up (merged into `main`). What this change reuses from it:

- `requireCompanyContext()` in `src/lib/access.ts`
- `requiredText`, `optionalText`, `fieldErrors`, `formValues`, `FormState` and `ServiceResult` in `src/lib/forms.ts`
- `NotFoundError` in `src/lib/errors.ts`
- `Field` and `ConfirmButton`, and the shadcn button, input, label and table components
- `src/lib/labels.ts` and `src/lib/validation.ts`
- the header in `src/app/(app)/layout.tsx`
- `scripts/seed-demo.ts`
- `src/test/temp-database.ts`
- Prisma's `partialIndexes` preview for "unique among non-deleted rows"

The employee fields mirror `ReferralSnapshot["employee"]` in `src/lib/referral-pdf/snapshot.ts` (already on `main`), so `create-referral` can copy them one to one.

## Goals / Non-Goals

**Goals:**
- One feature folder `src/features/employees/` in the same shape as `companies` and `users`: `service.ts`, `actions.ts` and `employee-form.tsx`.
- Employee rules as pure functions where they hold logic (the PESEL checksum and the conditional identity rule), unit-tested.

**Non-Goals:**
- No check that the sex or date of birth matches the PESEL. The form's sex field is the user's choice.
- No validation of the PESEL's embedded date, only its checksum.
- No change to the HR start page (it stays `/users`).
- No end-to-end test. Employees get exercised end to end by the `create-referral` flow, and the e2e budget is 5.

## Decisions

### Schema

```prisma
enum Sex { FEMALE MALE }

model Employee {
  id, companyId (relation to Company), firstName, lastName, sex Sex,
  pesel String?, idDocumentName String?, idDocumentNumber String?, birthDate String?,
  city, street String?, buildingNumber, flatNumber String?,
  position, workDescription, createdAt, updatedAt, deletedAt DateTime?

  @@unique([companyId, pesel], where: raw("deletedAt IS NULL"))
  @@index([companyId])
  @@map("employee")
}
```

SQLite treats NULLs as distinct in unique indexes, so employees without a PESEL never collide, and `pesel IS NOT NULL` isn't needed in the `WHERE`. Check that the generated migration SQL contains the `WHERE` (the same check the accounts design makes). `Company` gets the back relation `employees Employee[]`.

### `birthDate` is a `yyyy-MM-dd` string, not `DateTime`

`<input type="date">` submits `yyyy-MM-dd`, and the snapshot stores `yyyy-MM-dd`. A `DateTime` would add time-zone conversions on both ends for a calendar date that has no time. The schema checks that it parses as a real date (round-trips through `Date` to the same string) and isn't after today. **Alternative:** `DateTime` at UTC midnight. Rejected for the conversions. Record this in `docs/DATA-MODEL.md`.

### Validation: one zod schema with a cross-field rule

`employeeSchema` in the service: per-field `requiredText`/`optionalText`, `sex` as `z.enum`, `pesel` optional and checked with `isValidPesel`. A `superRefine` (or `.transform` + check) then:
- with a PESEL: sets `idDocumentName`, `idDocumentNumber` and `birthDate` to `null`
- without one: adds a Polish field error for each missing ID-document field and for a missing or invalid date of birth

`isValidPesel(value)` goes in `src/lib/validation.ts` next to `isValidNip`: 11 digits, weights 1,3,7,9,1,3,7,9,1,3, check digit `(10 - sum % 10) % 10`.

The form shows the ID-document fields in a block labelled "Jeśli brak numeru PESEL" (if there's no PESEL). They're always visible, with no client-side toggling.

### Service, scoped by the company context

Every function takes the `CompanyContext` and filters with `companyId: ctx.companyId, deletedAt: null`:
- `listEmployees(ctx)`: sorted by `lastName`, `firstName`
- `getEmployee(ctx, id)`: `findFirst`, otherwise `NotFoundError`
- `createEmployee(ctx, input)`
- `updateEmployee(ctx, id, input)`: `getEmployee` first
- `deleteEmployee(ctx, id)`: `updateMany` with the scope filter. `count === 0` → `NotFoundError`.

A Prisma `P2002` on create or update maps to `{ pesel: "Pracownik z tym numerem PESEL już istnieje." }`, the same way `companies/service.ts` handles NIP.

There's no permission function. Every role in a company context may manage employees (README Core: operators can do everything in their company, and admins and Telemedi can do at least as much).

### Pages and actions

- `/employees`: a table with the full name, PESEL (or the ID document number), position and edit/delete actions, plus a "Dodaj pracownika" link
- `/employees/new`
- `/employees/[id]/edit`

Each page and action calls `requireCompanyContext()` first. Actions follow `saveCompanyAction`: parse, call the service, return `FormState` on error, `revalidatePath` and redirect to `/employees` on success. The header gets a "Pracownicy" link, shown under the same condition as "Użytkownicy". Sex labels ("Kobieta", "Mężczyzna") go in `labels.ts`.

### Demo seed

`seed-demo.ts` creates each company's `employees` from `demo.json` only when that company has no non-deleted employees. That's enough for idempotency on a demo database, and it avoids per-row matching for the employee without a PESEL. Rows go through `employeeSchema.parse`, so invalid seed data fails loudly.

### Tests

- **Unit** (`validation.test.ts` and an employee schema test):
  - PESEL checksum, valid and invalid
  - the schema clears the ID-document fields when a PESEL is given
  - the schema needs all three ID-document fields without one
  - a future or impossible date of birth is rejected
- **Integration** (`src/features/employees.integration.test.ts`, on a migrated temporary database, calling the services directly):
  - create and list
  - duplicate PESEL in the same company rejected
  - same PESEL in another company allowed
  - a deleted employee's PESEL is reusable
  - employees without a PESEL don't collide
  - another company's employee is "not found" for get, update and delete
  - delete hides from the list but keeps the row

## Risks / Trade-offs

- [The base change isn't merged yet, and its helpers may still change] → Task 1 rebases onto `main` after accounts merges and re-reads those helpers before coding.
- [Two branches adding migrations in parallel (e.g. `manage-risk-factors`)] → Create the migration only after rebasing. If another migration lands first, rebase and regenerate it so the timestamps stay in order.
- [The "seed only into an empty company" rule doesn't top up partially seeded companies] → Acceptable for demo data on a fresh database.
- [The PESEL date isn't validated] → The checksum catches most typos, and the PESEL is only printed, never used for logic.

## Migration Plan

`npx prisma migrate dev --name manage_employees` after rebasing. `db:deploy` applies it on the next container start. No existing data is affected.
