# Tasks

## 1. Schema

- [x] 1.1 On an up-to-date `main` (merge it first if `manage-employees` has landed), add the `RiskCategory` enum, the `RiskFactor` model with its partial unique index, and `riskFactors` on `Company` (design: "One table…" and "Duplicate names…"). Run `npm run db:migrate -- --name manage_risk_factors`. Verify the migration SQL has `CREATE UNIQUE INDEX … WHERE deletedAt IS NULL`, and that a second `migrate dev` reports "Already in sync".

## 2. Predefined factors and service

- [x] 2.1 Add `src/features/risk-factors/predefined.ts` (`ensurePredefinedRiskFactors`) and call it from `scripts/seed.ts` and `scripts/seed-demo.ts`. Verify on a fresh database that `npm run db:seed` twice leaves 34 predefined factors.
- [x] 2.2 Add `src/features/risk-factors/service.ts`: schema, list, get, create, update, soft delete, and the duplicate rules. Verify with `npm run typecheck`. Behavior is covered in 2.3.
- [x] 2.3 Write the integration test covering every case under Tests in design.md. Verify with `npm test`.

## 3. UI

- [x] 3.1 Add `riskCategoryLabels` to `src/lib/labels.ts`, `actions.ts`, `risk-factor-form.tsx`, the pages `/risk-factors`, `/risk-factors/new` and `/risk-factors/[id]/edit` (each calling `requireCompanyContext()`), and the "Czynniki szkodliwe" header link. Verify in the dev server:
  - As an operator: the five sections appear in order, and predefined factors are marked with no actions.
  - Adding, editing and deleting (with confirmation) an own factor works.
  - "Hałas" under "Czynniki fizyczne" shows the duplicate error and keeps the entered values.
  - As Telemedi: switching company changes the own factors.

## 4. Demo data and docs

- [x] 4.1 Extend `scripts/seed-demo.ts` to create each company's `customRiskFactors` when the company has no own factors that aren't deleted. Verify that running `npm run db:seed:demo` twice on a fresh database gives 34 predefined factors and "Przykładowa Logistyka"'s 2 own factors.
- [x] 4.2 Update `docs/CONTEXT.md` project state, and the README seed lines if their wording no longer fits. Verify by reading the diff.

## 5. Final checks

- [x] 5.1 Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run test:e2e`. All must pass. Then do the Docker check once (AGENTS.md):
  - `docker compose up -d --build` on a new volume
  - after "Ready", the risk factor page lists the 34 predefined factors for a company

  Record the result under this task. If the agent can't reach Docker, report that and leave the check to the user.

  Result (2026-11-10):
  - Lint, typecheck, `npm test` (47 tests) and `npm run test:e2e` passed.
  - **Docker check passed**, run by the user (`sudo docker compose -p ffw-risk …`, new volume): startup seeded the predefined factors and reached Ready. With a company created through the UI, the risk factor page listed the predefined factors in all five sections. The test project was removed with `down -v`. The agent can't reach Docker ("permission denied").
  - After the Docker check, review fix #1 added a partial unique index on predefined names (`category, name WHERE companyId IS NULL`) and a single retry in `ensurePredefinedRiskFactors`, so two seed runs at once can't duplicate the list. The migration was regenerated. Lint, typecheck, 47 tests (including a new parallel-seed assertion that failed before the fix), the demo seed run twice and the e2e test all passed again. The Docker check wasn't repeated, per AGENTS.md; the change is one additive index in the same migration.

## Workflow follow-up

- Implement in a worktree on branch `manage-risk-factors` (AGENTS.md).
- Verify with `/opsx:verify`, merge, then archive with `/opsx:archive`.
