# Proposal

## Why

After `create-referral`, a referral can only be reached right after creating it. HR has no way to find earlier referrals, check their status or download their PDF again. Telemedi has no way to move a referral through its statuses or remove one issued by mistake.

## What Changes

- A company referral list at `/referrals`, newest first, for every user working in a company context. It shows the employee's name, the exam type, the issue date, the deadline and the status, with links to the summary and the PDF.
- The list reads everything from each referral's snapshot, so referrals of deleted employees stay listed unchanged.
- Telemedi changes a referral's status on its summary page, choosing any of the five mocked statuses with no transition rules (ledger Q5).
- Telemedi soft deletes a referral from its summary page, with a confirmation prompt. A deleted referral disappears from the list, and its summary and PDF are no longer available.
- HR users (admins and operators) see statuses read-only and can't delete referrals.
- A "Skierowania" link in the header, and a "Nowe skierowanie" button on the list.

Out of scope:
- HR cancelling a referral. This is an open question in README, and today only Telemedi changes statuses.
- Filtering, sorting, search and pagination (README Deferred).
- Restoring deleted referrals (Deferred).
- Status transition rules (SCOPE-CUTS).
- Demo referrals. `create-referral` moved them to the later `apply-referral-template` change.

## Capabilities

### New Capabilities

- `referral-tracking`: listing a company's referrals, Telemedi-only status changes, and soft deletion of referrals.

### Modified Capabilities

None. Creating referrals, their snapshot and the PDF download belong to `referral-creation` (added by `create-referral`). This change only lists, re-reads and updates referrals.

## Impact

- **Depends on `create-referral`** (the `Referral` model, `ReferralStatus`, `getReferral`, `/referrals/[id]` and its PDF route, `referralStatusLabels`). Implementation starts only after that change is merged into `main`.
- **No schema change.** Status and `deletedAt` already exist on `Referral`.
- **Code:**
  - `listReferrals`, `setReferralStatus` and `deleteReferral` in `src/features/referrals/service.ts`, with actions next to them
  - the `/referrals` page
  - Telemedi controls on `/referrals/[id]`
  - the header link
- **Tests:** one integration test for the service on a real temporary database.
- **Docs:** the project state in `docs/CONTEXT.md`.
