# Tasks

## 1. Schema

- [x] 1.1 On an up-to-date `main` (merge it first if `manage-referral-templates` has landed), add `ExamType`, `ReferralStatus` and the `Referral` model with its restrict relations and back relations (design: Schema). Run `npm run db:migrate -- --name create_referral`, then `npm run db:generate`. Verify that a second `migrate dev` reports "Already in sync".

## 2. Snapshot and service

- [x] 2.1 Add `src/features/referrals/snapshot.ts` (`buildSnapshot`, `referralSnapshotSchema` satisfying `ReferralSnapshot`, `warsawDate`, `defaultEmploymentStatus`) and `snapshot.test.ts` covering the unit cases in design.md. Verify with `npm test`.
- [x] 2.2 Add `src/features/referrals/service.ts` (`referralInputSchema`, `createReferral`, `getReferral`) per design. Verify with `npm run typecheck`. Behavior is covered in 2.3.
- [x] 2.3 Write `referrals.integration.test.ts` covering every integration case in design.md. Verify with `npm test`.

## 3. UI and PDF route

- [x] 3.1 Add the labels (`examTypeLabels`, `employmentStatusLabels`, `referralStatusLabels`), the optional `factorIds` in `FormState.values`, `actions.ts`, `referral-form.tsx`, the pages `/referrals/new` (both steps) and `/referrals/[id]`, and the "Nowe skierowanie" header link. Verify in the dev server as an operator:
  - The two steps work and the form is pre-filled.
  - Choosing "Wstępne" switches the employment status, and a manual change sticks.
  - A validation error keeps the checked factors and the exposures.
  - The summary page appears after saving.
  - As Telemedi: only the selected company's employees and factors are offered.
- [x] 3.2 Add the `/referrals/[id]/pdf` route handler (design: Pages and route). Verify in the dev server:
  - The PDF downloads with the entered data.
  - Another company's referral ID gives 404.
  - Logged out, it redirects to `/login`.

## 4. E2E and docs

- [x] 4.1 Add `tests/e2e/referral.spec.ts` (design: Tests). Verify with `npm run test:e2e`: 2 tests, both passing.
- [x] 4.2 Update `docs/notes.md`: row 6 says templates move to 6b, and new row 6b `apply-referral-template` covers the template select that pre-fills factors and exposures, the demo referrals, and reconciling the two factor pickers. Update the `docs/CONTEXT.md` project state. Verify by reading the diff.

## 5. Final checks

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run test:e2e`. All must pass. Then do the Docker check once (AGENTS.md):
  - `docker compose up -d --build` on a new volume
  - after "Ready", load the demo data, create a referral and download its PDF in the container

  Record the result under this task. If the agent can't reach Docker, report that and leave the check to the user.

  Result (2026-11-10):
  - Lint, typecheck, `npm test` (65 tests) and `npm run test:e2e` (2 tests, including the PDF download) passed locally.
  - **The Docker check was skipped by the user's decision.** The agent can't reach Docker ("permission denied"). PDF rendering inside the container is untested for this change. The image already has Chromium and fonts from `render-referral-pdf`.

## Workflow follow-up

- Implement in a worktree on branch `create-referral` (AGENTS.md).
- Verify with `/opsx:verify`, merge, then archive with `/opsx:archive`.
