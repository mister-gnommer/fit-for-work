# Tasks

## 1. Base

- [x] 1.1 Confirm `manage-risk-factors` is merged into `main` (`git log main`). If it isn't, stop and report. Create the worktree and branch `manage-referral-templates` from `main`, run `npm ci` and `npm run db:generate`, create a local `.env` from `.env.example`, and re-read `src/features/risk-factors/`, `src/features/employees/` and `src/lib/labels.ts`. Verify `npm run typecheck` and `npm test` pass before any change.

## 2. Selection parsing

- [x] 2.1 Add `src/features/templates/selection.ts` with `readFactorSelection(formData)` (design: Form encoding). Verify `selection.test.ts` covers: unchecked factors ignored even with an exposure level, exposure levels trimmed with empty ones as null, and no checked factor giving an empty list.

## 3. Schema and service

- [x] 3.1 Add `ReferralTemplate` and `ReferralTemplateFactor` (design: Schema), with back relations on `Company` and `RiskFactor`. Run `npm run db:migrate -- --name manage_referral_templates`, then `npm run db:generate`. Verify the migration SQL contains `CREATE UNIQUE INDEX … WHERE deletedAt IS NULL` for the template name.
- [x] 3.2 Add `src/features/templates/service.ts`: `templateSchema`, the allowed-factor check, and the scoped `listTemplates`, `getTemplate`, `createTemplate`, `updateTemplate` and `deleteTemplate`, with P2002 mapped to the Polish name error. Reads filter out deleted factors. Verify `npm run typecheck` passes.
- [x] 3.3 Add `src/features/templates.integration.test.ts` covering the cases listed in design: Tests. Verify `npm test` passes.

## 4. UI

- [x] 4.1 Move `ROMAN` from the risk-factors page to `labels.ts` as `riskCategoryNumerals` and use it there. Add `actions.ts`, `template-form.tsx` and the pages `/templates`, `/templates/new` and `/templates/[id]/edit`, each calling `requireCompanyContext()`. Add "Szablony" to the header.
  Verify in the dev server as an operator:
  - create a template with two factors and one exposure level
  - saving with no factor shows the error and keeps the name
  - edit replaces the factors, and the values persist
  - delete with confirmation removes the row
  - after deleting an own factor on `/risk-factors`, the template no longer shows it

## 5. Demo seed and docs

- [x] 5.1 Extend `scripts/seed-demo.ts` to create each company's templates from `docs/seed/demo.json` (design: Demo seed). Verify that running `npm run db:seed:demo` twice on a fresh database leaves exactly the two demo templates, with their factors and exposure levels.
- [x] 5.2 In `docs/DATA-MODEL.md`, add the template-name partial unique index to `ReferralTemplate`. Update the project state in `docs/CONTEXT.md`. Re-read both right before editing. Verify the docs match the schema.

## 6. Integration checks

- [x] 6.1 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run test:e2e`. Verify all of them pass.
- [ ] 6.2 Docker check (AGENTS.md): build and run the container, apply the migration at start, load the demo data, and open `/templates`. If the agent can't run Docker, give the user step-by-step commands. Record the result here. Never mark it passed without a run.
  Result (2026-11-10): **not run**, skipped by the user. The Dockerfile and `compose.yaml` are unchanged; the change adds a migration, app code and seed data.

## Workflow follow-up

- Verify with `/opsx:verify`, then merge into `main` and archive the change.
