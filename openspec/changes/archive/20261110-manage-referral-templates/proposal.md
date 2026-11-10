# Proposal

## Why

HR picks the same risk factors again and again for the same kind of job. A template stores that set once, with the exposure levels for that workplace, so `create-referral` can apply it in one step and the operator only adjusts it.

## What Changes

- A company template list, plus create and edit forms, in Polish, for every user working in a company context: admins, operators, and Telemedi through the switcher.
- A template has a name and one or more risk factors, chosen from the predefined factors and the company's own. Each chosen factor has an optional exposure level as free text.
- Templates reference factors and don't copy them. Renaming a company factor shows the new name in its templates. A soft-deleted factor disappears from every template that uses it.
- Only factors the company can see can be added to its templates: predefined ones and its own non-deleted ones.
- Template names are unique among the company's non-deleted templates.
- Soft delete of templates, with a confirmation prompt.
- A "Szablony" link in the header.
- `npm run db:seed:demo` also loads the demo company's templates from `docs/seed/demo.json`.

Out of scope: applying a template to a referral (`create-referral`), a warning when someone edits a factor that a template uses (README Deferred), search, sorting and pagination (Deferred), and restoring deleted templates (Deferred).

## Capabilities

### New Capabilities

- `referral-templates`: a company's named sets of risk factors with optional exposure levels, which factors they may contain, and how factor edits and deletions show up in them.

### Modified Capabilities

None. Company scoping comes from `company-management`, and the factors come from `risk-factor-management` (added by `manage-risk-factors`). This change uses both without changing them.

## Impact

- **Depends on `manage-risk-factors`** (the `RiskFactor` model, `riskCategoryLabels`, predefined and demo factors). Implementation starts only after that change is merged into `main`.
- **Prisma:** `ReferralTemplate` and `ReferralTemplateFactor` models in one new migration, with a partial unique index on the template name per company among non-deleted rows.
- **New code:** `src/features/templates/` (service, actions, form), and the `/templates` pages.
- **Tests:** a unit test for reading the factor selection from the form, and one integration test for the service on a real temporary database.
- **Docs:** `docs/DATA-MODEL.md` (the template name index) and the project state in `docs/CONTEXT.md`.
