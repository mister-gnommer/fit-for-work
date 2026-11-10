# Design

## Context

This change builds on `create-referral`. It isn't merged yet, and its work is uncommitted in the `fit-for-work-create-referral` worktree. The plan below is based on its current design and code:

- **`Referral`**: `id, companyId, employeeId, createdById, examType, status (default CREATED), deadline (yyyy-MM-dd string), snapshot Json, createdAt, updatedAt, deletedAt?`, with `@@index([companyId])`.
- **`src/features/referrals/service.ts`**:
  - `createReferral(ctx, employeeId, input, now)`
  - `getReferral(ctx, id)`, which is scoped by company and `deletedAt: null` and parses the snapshot with `referralSnapshotSchema`
- **`/referrals/[id]`**: a summary page with a "Pobierz PDF" link.
- **`/referrals/[id]/pdf`**: a route handler. It calls `getReferral`, so a deleted or foreign referral is already a 404.
- **`referralStatusLabels`** in `labels.ts` ("Utworzone", "W realizacji", "Potwierdzone", "Zrealizowane", "Anulowane"), plus `examTypeLabels`.
- **A "Nowe skierowanie" header link.**

The snapshot holds `employee.firstName`, `lastName`, `examType` and `issueDate`, which is everything the list prints.

## Goals / Non-Goals

**Goals:**
- A list built only from the snapshot plus the `status` and `deadline` columns, with no join to `Employee`.
- Telemedi-only status changes and deletes, enforced in the service.

**Non-Goals:**
- Status controls on the list rows. Telemedi uses the summary page.
- Any change to `createReferral`, the snapshot or the PDF route.
- A new e2e test. The rules are covered by the integration test and the list is checked by hand.

## Decisions

### List from the snapshot

`listReferrals(ctx)`:
- `findMany({ where: { companyId: ctx.companyId, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id, status, deadline, snapshot } })`
- Each snapshot is parsed with `referralSnapshotSchema`, the same way `getReferral` does. Rows map to `{ id, status, deadline, employeeName, examType, issueDate }`.

Reading the snapshot keeps deleted and renamed employees exactly as they were issued, with no `Employee` join. That's the "frozen" rule from PRODUCT-DECISIONS.

**Alternative: join `Employee` for the name.** Rejected: it would show the current name, not the issued one, and need extra handling for deleted employees.

A snapshot that fails to parse throws and breaks the page. That can only happen through a bug, because `createReferral` validates the snapshot before writing it.

### Telemedi-only updates in the service

`setReferralStatus(ctx, id, status)` and `deleteReferral(ctx, id)` both do the same steps:
1. Throw `ForbiddenError` unless `ctx.user.role === Role.TELEMEDI`. This is the same check as `assertTelemedi` in `companies/service.ts`.
2. Run `updateMany({ where: { id, companyId: ctx.companyId, deletedAt: null }, data })`.
3. Throw `NotFoundError` when `count === 0`.

Telemedi's `ctx.companyId` is the company selected in the switcher, so a referral of another company is "not found" for Telemedi too. There are no transition rules (ledger Q5): any of the five values is accepted from any status.

**Alternative: a `canManageReferrals` function in `permissions.ts`.** Rejected: it would be a one-line role check with nothing to unit-test, and `companies` already does this inline.

### Actions

In `src/features/referrals/actions.ts`:
- `setReferralStatusAction(id, formData)` calls `requireCompanyContext()`, then parses `status` with `z.enum(ReferralStatus)`. An invalid value can only come from a tampered request, so it throws (generic error page) and nothing changes. On success it calls the service and `revalidatePath("/referrals", "layout")` (the list and the summary), and stays on the summary.
- `deleteReferralAction(id)` calls `requireCompanyContext()` and the service, revalidates, and redirects to `/referrals`.

Neither action needs `useActionState`: there are no field errors to show.

### Pages

- **`/referrals`:**
  - The heading "Skierowania" and a "Nowe skierowanie" button.
  - A table with the employee, the exam type (`examTypeLabels`), the issue date, the deadline, the status (`referralStatusLabels`), and "Szczegóły" and "Pobierz PDF" links.
  - When the company has no referrals, the text "Brak skierowań." is shown.
- **`/referrals/[id]`:** when `ctx.user.role` is Telemedi, the page adds:
  - a form with a native status select and a "Zmień status" button
  - a `ConfirmButton` "Usuń skierowanie"

  Admins and operators see the page unchanged. The select gets `key={status}`, because React ignores `defaultValue` changes on a mounted select, and after a status change the revalidated page must show the new value. The `manage-employees` sex select hit the same issue.
- **Header:** "Nowe skierowanie" becomes "Skierowania" (to `/referrals`), shown under the same condition as the other company links. Creating a referral starts from the list's button.

### Tests

One integration test (`src/features/referrals/tracking.integration.test.ts`), on a migrated temporary database. It creates referrals through `createReferral` with fixed `now` values:
- the list is newest first and holds the snapshot's name, exam type and issue date
- after the employee is renamed and deleted, the list still shows the issued name
- another company's list doesn't include them
- Telemedi sets `DONE`, then from `CANCELLED` back to `IN_PROGRESS`
- an operator and an admin get `ForbiddenError` for both the status change and the delete, and nothing changes
- Telemedi in another company gets `NotFoundError`
- after Telemedi deletes a referral, the list drops it, `getReferral` gives `NotFoundError`, and the row keeps `deletedAt`

## Risks / Trade-offs

- [`create-referral` may still change `getReferral`, the snapshot fields or the header] → Task 1 waits for it on `main`, then re-reads its service, pages and labels before coding.
- [Parsing every snapshot on each list load] → A few dozen rows per company. Fine at the README's scale.
- [Replacing the "Nowe skierowanie" header link] → One click more to create a referral, in return for a header that leads to the list. Easy to revert.

## Migration Plan

No migration. The change is code only and needs no data changes.
