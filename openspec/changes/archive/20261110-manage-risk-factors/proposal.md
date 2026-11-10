# Proposal

## Why

Each referral lists risk factors (*czynniki szkodliwe*) under the five legal categories of the official form. HR needs a list to pick from: the predefined factors from Annex 1 of the regulation, plus the company's own. Templates (change 5) and referral creation (change 6) both build on this list. It depends only on accounts and company access, so it can run in parallel with `manage-employees`.

## What Changes

- A `RiskCategory` enum (`PHYSICAL`, `DUSTS`, `CHEMICAL`, `BIOLOGICAL`, `OTHER`, matching the form's I–V) and a `RiskFactor` model.
- **Predefined factors:**
  - The 34 factors from `docs/seed/risk-factors.json` are seeded by `npm run db:seed` (container start) and by `npm run db:seed:demo`.
  - The seed only adds missing ones. It never renames or deletes.
  - Nobody can edit or delete them, Telemedi included.
- **Company factors:**
  - Every user in the company context can add, edit (category and name) and soft delete the company's own factors. That's admins, operators, and Telemedi for the selected company.
  - Names are plain text.
  - A name can't repeat within the same category, whether it matches a predefined factor or one of the company's own factors that isn't deleted. This is an assumption made here, so the template picker never shows two identical entries.
- A Polish "Czynniki szkodliwe" page, `/risk-factors`:
  - factors grouped under the five official category headings
  - predefined factors marked and read-only
  - edit and delete actions on the company's own factors
  - a header link next to "Użytkownicy"
- Polish category labels (official form wording) in `src/lib/labels.ts`.
- The demo seed adds the presentation company's own factors from `docs/seed/demo.json`.

Out of scope:
- the exposure level, which belongs to a template's factor (change 5)
- the warning when an edited factor is used by a template (Deferred)
- managing the predefined list in the UI
- restoring deleted factors

## Capabilities

### New Capabilities

- `risk-factor-management`: the five categories, the predefined factors and their seeding, company-owned factors (create, edit, soft delete, duplicate rule), company scoping, and the demo factors.

### Modified Capabilities

None. The `db:seed` and `db:seed:demo` commands gain records, but their existing requirements (`user-accounts`, `development-workflow`) don't change.

## Impact

- **Prisma:** the `RiskCategory` enum and the `RiskFactor` model, with a partial unique index on company factor names among rows that aren't deleted, in one new migration. `Company` gets a `riskFactors` back relation.
- **New code:**
  - `src/features/risk-factors/` (service, actions, form, predefined-factor seeding)
  - the `/risk-factors` pages
  - category labels
- **Changed code:**
  - `scripts/seed.ts` and `scripts/seed-demo.ts`
  - the header in `src/app/(app)/layout.tsx`
- **Parallel work:** `manage-employees` edits the same `schema.prisma`, `labels.ts`, header and `seed-demo.ts`, and also adds a migration. Whichever merges second rebases and regenerates its migration (see design).
- **Tests:** one integration test. No new e2e test; the 4 remaining slots are kept for the referral flows.
