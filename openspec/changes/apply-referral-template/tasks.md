# Tasks

## 1. Shared factor picker

- [x] 1.1 Add `src/components/factor-picker.tsx` (design: "One shared picker…") and switch `TemplateForm` to it. Verify with `npm run typecheck`, `npm test` (`selection.test.ts`), and in the dev server: creating and editing a template still keeps the ticked factors and exposure levels, including after a validation error.
- [x] 1.2 Switch `ReferralForm` to the picker with an `initial` map, make the referral action read factors with `readFactorSelection`, and remove `FormState.factorIds` and the referral form's `ROMAN`. Verify with `npm run typecheck` and the existing `npm run test:e2e` referral test.

## 2. Apply a template

- [x] 2.1 Add the `templateId` select to step 1 of `/referrals/new`, load the template with `getTemplate` in step 2, pre-tick its factors and exposure levels, and show "Szablon: <name>" with "Zmień". Verify in the dev server:
  - "Magazynier" ticks its 3 factors with their exposure levels, and the employee's position stays.
  - Unticking a factor and editing an exposure before saving is reflected in the summary and PDF.
  - A template whose factor was deleted ticks only its live factors.
  - Another company's template ID gives the error page.
- [x] 2.2 Extend `tests/e2e/referral.spec.ts` to start from the "Magazynier" template: the factors are pre-ticked, one exposure level is changed, and the PDF still downloads. Verify with `npm run test:e2e` (still 2 referral-related tests at most, 5 overall).

## 3. Demo referrals

- [x] 3.1 Add the explicit `factors` list to the `employeeIndex` 5 referral in `docs/seed/demo.json`, and `ensureReferrals` to `scripts/seed-demo.ts` (design: "Demo referrals…"). Verify that `npm run db:seed:demo` twice on a fresh database gives 5 referrals, one per status, covering all three exam types, and that each one's PDF downloads in the dev server.
- [x] 3.2 Add one integration test showing that a referral created like the demo seed does, from a template, snapshots the template's live factors and exposure levels, and that editing the template afterwards leaves the snapshot unchanged. Verify with `npm test`.

## 4. Docs and final checks

- [x] 4.1 Mark 6b in `docs/notes.md`, update the `docs/CONTEXT.md` project state, and add a README note that the demo now includes referrals. Verify by reading the diff.
- [x] 4.2 Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run test:e2e`. All must pass.

## Workflow follow-up

- Implement in a worktree on branch `apply-referral-template` (AGENTS.md).
- Verify with `/opsx:verify`, merge, then archive with `/opsx:archive`.
