# Design

## Context

`accounts-and-company-access` is on `main`, and this change reuses its pieces:
- `requireCompanyContext()` (`src/lib/access.ts`)
- the form helpers (`src/lib/forms.ts`: `FormState`, `requiredText`, `fieldErrors`, `formValues`)
- `Field` and `ConfirmButton`
- the feature layout `src/features/<name>/{service,actions,…}.ts`
- unique-violation handling (`saveUniqueNip` in `src/features/companies/service.ts`)
- the integration-test pattern (`src/features/accounts.integration.test.ts` with `createMigratedDatabase`)

The 34 predefined factors live in `docs/seed/risk-factors.json` as `{ category, name }`. The demo company's own factors are under `companies[].customRiskFactors` in `docs/seed/demo.json`.

The referral-PDF module already declares the same five category values as a string union, with its own headings (`src/lib/referral-pdf/`). This change leaves it alone, because the values match and `create-referral` will map the Prisma enum to it.

`manage-employees` is running in parallel and touches `schema.prisma`, `labels.ts`, the `(app)` header and `seed-demo.ts`.

## Goals / Non-Goals

**Goals:** a factor list that templates and referrals can reference by ID, and company factors managed with the same patterns as users and companies.

**Non-Goals:**
- exposure levels (template factors, change 5)
- a picker component for templates
- reusing labels in the PDF module
- editing predefined factors through the UI or the seed

## Decisions

### One table for predefined and company factors

`RiskFactor { id, category: RiskCategory, name, companyId?, createdAt, updatedAt, deletedAt? }`, as in `docs/DATA-MODEL.md`. A null `companyId` means predefined. Templates will reference both kinds through a single foreign key.

**Alternative: a separate predefined table.** Rejected: templates and referrals would need two kinds of reference.

The link to the company uses `onDelete: Restrict` (added during implementation). With Prisma's default `SET NULL`, hard-deleting a company would silently turn its factors into predefined ones visible to every company. Companies are only soft-deleted today, so this is a guard, not a behavior change.

### Read-only predefined factors through the scoping filter

Every lookup by ID uses `findFirst({ where: { id, companyId: ctx.companyId, deletedAt: null } })`. Predefined rows have a null `companyId`, so edit and delete find nothing and throw `NotFoundError`. Another company's factor behaves the same way. No extra permission function is needed: every company-context user may manage the company's own factors, and `requireCompanyContext()` is the whole check.

### Duplicate names: index for own factors, a check for predefined ones

- Own factors: `@@unique([companyId, category, name], where: raw("deletedAt IS NULL"))`. SQLite treats NULLs as distinct, so predefined rows never collide with each other here. A `P2002` becomes the Polish error "Taki czynnik już istnieje w tej kategorii." on `name`, the same way `saveUniqueNip` handles NIPs.
- Predefined factors: before saving, the service checks `findFirst({ companyId: null, category, name })` and returns the same field error.
- Predefined list itself (added after review): `@@unique([category, name], where: raw("companyId IS NULL"))`, so two seed runs at once (container start and `db:seed:demo`) can't duplicate it. `ensurePredefinedRiskFactors` retries once on `P2002`, skipping what the other run inserted; a second failure propagates.
- Names are trimmed by the schema and compared case-sensitively. "hałas" next to "Hałas" is allowed. That's acceptable for an MVP and matches what the database enforces.

The migration SQL must contain the `WHERE deletedAt IS NULL` clause; check it, as the earlier changes did.

### Seeding predefined factors

`src/features/risk-factors/predefined.ts` exports `ensurePredefinedRiskFactors()`:
- It reads `docs/seed/risk-factors.json` and validates each row with the zod category enum.
- It inserts each `{ category, name }` that has no predefined row yet.
- It never updates or deletes anything.
- The path is relative to the working directory. Scripts, tests and the container (`/app`) all run from the repo root, and `.dockerignore` already re-includes `docs/seed`.

Both `scripts/seed.ts` (after the secret check, before the Telemedi step) and `scripts/seed-demo.ts` call it. That means container start, the e2e database and integration tests all get the list.

**Alternative: `INSERT`s in the migration.** Rejected: it duplicates the JSON in SQL, and changing the list later would need a new migration.

### Demo factors

`seed-demo.ts` creates a company's `customRiskFactors` only when that company has no own factors that aren't deleted. It's the same rule `manage-employees` uses for employees, and it keeps the script idempotent without matching each row.

### Service, actions and pages

`src/features/risk-factors/`:

| File | Contents |
|---|---|
| `service.ts` | `riskFactorSchema` (`category` as a zod enum with a Polish message, `name` from `requiredText` plus `.max(200)`), `listRiskFactors(companyId)` (predefined and own factors that aren't deleted, ordered by `createdAt`), `getCompanyRiskFactor(ctx, id)`, `createRiskFactor`, `updateRiskFactor`, `deleteRiskFactor` (soft) |
| `actions.ts` | `saveRiskFactorAction(id \| null, state, formData)` and `deleteRiskFactorAction(id)`. Each calls `requireCompanyContext()` first, then revalidates and redirects to `/risk-factors`. |
| `risk-factor-form.tsx` | A native category select plus the `Field` for the name |

Pages:
- `/risk-factors`: one section per category in enum order, headed "I. Czynniki fizyczne" and so on. Each section lists predefined factors first (marked "predefiniowany", no actions), then the company's own factors with "Edytuj" and "Usuń" (confirmation). There's one "Dodaj czynnik" button.
- `/risk-factors/new` and `/risk-factors/[id]/edit`

`labels.ts` gets `riskCategoryLabels: Record<RiskCategory, string>` with the official form wording. The header gets "Czynniki szkodliwe", shown under the same condition as "Użytkownicy".

### Tests

- **One integration test** (`src/features/risk-factors/risk-factors.integration.test.ts`), on a migrated temporary database, with the services called directly:
  - seeding twice gives 34 predefined factors
  - create an own factor, then edit it
  - a duplicate of a predefined factor and a duplicate of an own factor are both rejected
  - the same name in another category, or in another company, is allowed
  - the name of a deleted factor can be reused
  - predefined factors and another company's factor give `NotFoundError` on edit or delete
  - the list for company A contains the predefined factors plus only A's own
- **No unit tests:** there's no new pure logic worth testing.
- **No e2e test.** The page is checked manually in the dev server.

## Risks / Trade-offs

- [Parallel migration with `manage-employees`] → Create the migration only right before implementing, on an up-to-date `main`. If `manage-employees` merges first, rebase, delete this change's migration folder and regenerate it with `npm run db:migrate`, so the timestamps stay in order and `migrate dev` reports no drift.
- [Merge conflicts in `labels.ts`, the header and `seed-demo.ts`] → Small additive edits. Whoever merges second keeps both sides.
- [Case-sensitive duplicate check] → Accepted. A case-insensitive check would need a normalized column or `COLLATE NOCASE`. Not worth it now.
- [Soft-deleted factors used by templates] → No templates exist yet. Change 5 decides how a deleted factor disappears from templates (DATA-MODEL already says it does).

## Migration Plan

One additive migration (`manage_risk_factors`). The container applies it at start, then `db:seed` inserts the predefined factors. Existing data isn't touched. The Docker check runs once at the end of the change (AGENTS.md), by the user if the agent can't reach Docker.
