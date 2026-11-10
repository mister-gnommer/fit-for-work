# Tasks

## 1. Base

- [x] 1.1 Confirm `create-referral` is merged into `main` (`git log main`). If it isn't, stop and report. Create the worktree and branch `list-and-track-referrals` from `main`, run `npm ci` and `npm run db:generate`, create a local `.env` from `.env.example`, and re-read `src/features/referrals/`, `src/app/(app)/referrals/` and the referral labels in `src/lib/labels.ts`. If `getReferral`, the snapshot fields or the pages differ from design.md's Context, update design.md first. Verify `npm run typecheck` and `npm test` pass before any change.

## 2. Service

- [x] 2.1 Add `listReferrals`, `setReferralStatus` and `deleteReferral` to `src/features/referrals/service.ts` (design: List from the snapshot, Telemedi-only updates). Verify `npm run typecheck` passes.
- [x] 2.2 Add `src/features/referrals/tracking.integration.test.ts` covering the cases in design: Tests. Verify `npm test` passes.

## 3. UI

- [x] 3.1 Add `setReferralStatusAction` and `deleteReferralAction`, the `/referrals` page, the Telemedi controls on `/referrals/[id]`, and change the header link to "Skierowania".
  Verify in the dev server:
  - As an operator: create two referrals, and the list shows them newest first. "Pobierz PDF" from the list downloads a PDF. The summary page has no status or delete controls.
  - As Telemedi, with the company selected: change a status, and it shows on the summary and in the list. Delete with confirmation, and the referral leaves the list and its summary URL shows the not-found page.
  - Delete an employee who has a referral, and the referral stays listed.

## 4. Docs

- [x] 4.1 Update the project state in `docs/CONTEXT.md`, and mark row 7 as done in `docs/notes.md` when merging. Re-read both right before editing. Verify by reading the diff.

## 5. Integration checks

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run test:e2e`. Verify all of them pass.

## Workflow follow-up

- Verify with `/opsx:verify`, then merge into `main` and archive the change.
