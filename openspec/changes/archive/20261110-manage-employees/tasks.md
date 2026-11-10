# Tasks

## 1. Base

- [x] 1.1 Confirm `accounts-and-company-access` is merged into `main` (`git log main`). If it isn't, stop and report. Rebase `manage-employees` onto `main`, run `npm ci` and `npm run db:generate`, and re-read `src/lib/access.ts`, `src/lib/forms.ts`, `src/features/companies/` and `node_modules/next/dist/docs/` guides for Server Actions and forms. Verify `npm run typecheck` and `npm test` pass before any change.

## 2. Validation

- [x] 2.1 Add `isValidPesel` to `src/lib/validation.ts` (weights 1,3,7,9,1,3,7,9,1,3; check digit `(10 - sum % 10) % 10`). Verify unit tests in `validation.test.ts` cover a valid PESEL, a wrong check digit and a wrong length or non-digit input.

## 3. Schema and service

- [x] 3.1 Add the `Sex` enum and the `Employee` model with the partial unique index (design: Schema), plus `employees` on `Company`. Run `npm run db:migrate -- --name manage_employees`. Verify the migration SQL contains `CREATE UNIQUE INDEX … WHERE deletedAt IS NULL`.
- [x] 3.2 Add `src/features/employees/service.ts` with `employeeSchema` (the cross-field identity rule and the `yyyy-MM-dd` past birth date) and the scoped `list/get/create/update/deleteEmployee` functions, mapping `P2002` to the Polish PESEL error. Verify with unit tests for the schema: a PESEL clears the ID-document fields, missing ID-document fields each get an error, and a future or impossible date of birth is rejected.
- [x] 3.3 Add `src/features/employees.integration.test.ts` on a migrated temporary database. It covers create and list, duplicate PESEL rejected, same PESEL in another company allowed, a deleted employee's PESEL reusable, employees without a PESEL not colliding, another company's employee being "not found" for get, update and delete, and delete hiding the row while keeping it. Verify `npm test` passes.

## 4. UI

- [x] 4.1 Add `sexLabels` to `src/lib/labels.ts`, `actions.ts` and `employee-form.tsx` (the ID-document block labelled "Jeśli brak numeru PESEL", a native sex select, `type="date"` for the birth date), and the pages `/employees`, `/employees/new` and `/employees/[id]/edit`, each calling `requireCompanyContext()`. Add "Pracownicy" to the header. Verify in the dev server as an operator: create, edit (the values persist), a validation error keeps the entered values, and delete with confirmation removes the row from the list. As Telemedi: switching company changes the list.

## 5. Demo seed and docs

- [x] 5.1 Extend `scripts/seed-demo.ts` to create each company's employees from `docs/seed/demo.json` through `employeeSchema`, only when the company has no non-deleted employees. Verify that running `npm run db:seed:demo` twice on a fresh database leaves exactly the listed employees, including the one without a PESEL.
- [x] 5.2 Note in `docs/DATA-MODEL.md` that `birthDate` is a `yyyy-MM-dd` string, and update the project state in `docs/CONTEXT.md` (re-read both right before editing). Verify the docs match the schema.

## 6. Integration checks

- [x] 6.1 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run test:e2e`. All of them must pass.

## Workflow follow-up

- Verify with `/opsx:verify`, then merge into `main` and archive the change.

## Docker check

Not run (2026-11-10): skipped by the user for lack of time. The Dockerfile and `compose.yaml` are unchanged, and the change only adds a migration and app code. It is **not** marked passed.
