# Proposal

## Why

A referral is issued for an employee, and the form prints the employee's identity, home address, position and work description. HR has nowhere to enter that data yet. This change adds it, so `create-referral` can copy an employee into the frozen snapshot.

## What Changes

- Company employee list, plus create and edit forms, in Polish, for every user working in a company context: admins, operators and Telemedi through the switcher.
- Employee fields, matching the referral snapshot's `employee` block:
  - first and last name, sex
  - PESEL, or, without one, the ID document's name and number plus date of birth
  - home address: town, optional street, building number, optional flat number
  - position and work description
- The PESEL checksum is validated. A PESEL is unique among the company's employees who aren't deleted. The same PESEL can exist in another company, and a deleted employee's PESEL can be reused.
- Soft delete of employees, with a confirmation prompt. Deleted employees disappear from the list and can't be opened or edited.
- A "Pracownicy" link in the header.
- `npm run db:seed:demo` also loads the demo company's employees from `docs/seed/demo.json`.

Out of scope: Excel import (README Deferred), search, sorting and pagination (Deferred), restoring deleted employees (Deferred), and anything about referrals.

## Capabilities

### New Capabilities

- `employee-management`: a company's employee records, their identity and address validation, PESEL uniqueness within the company, and soft deletion.

### Modified Capabilities

None. Company scoping and access come from `company-management` (added by `accounts-and-company-access`), and this change follows them without changing them.

## Impact

- **Depends on `accounts-and-company-access`** (the `Company` model, access helpers, form helpers, header and demo seed). Implementation starts only after that change is merged into `main`.
- **Prisma:** an `Employee` model and a `Sex` enum, with a partial unique index on `(companyId, pesel)` among non-deleted rows, in one new migration.
- **New code:** `src/features/employees/` (service, actions, form), the `/employees` pages, a PESEL check in `src/lib/validation.ts`, and sex labels in `src/lib/labels.ts`.
- **Tests:** unit tests for the PESEL checksum and the conditional identity rule, plus one integration test for the service on a real temporary database.
- **Docs:** `docs/DATA-MODEL.md` (the `birthDate` storage format) and the project state in `docs/CONTEXT.md`.
