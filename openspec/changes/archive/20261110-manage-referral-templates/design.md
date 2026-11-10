# Design

## Context

This change builds on two earlier ones:
- `manage-employees`, which is merged. It set the feature pattern this change copies: `src/features/<name>/{service,actions,<name>-form}.ts(x)`, `requireCompanyContext()`, the form helpers in `src/lib/forms.ts`, `Field`, `ConfirmButton`, P2002 → Polish field error, and an integration test on `createMigratedDatabase`.
- `manage-risk-factors`, which is committed on its branch but not merged yet. It provides:
  - the `RiskFactor` model: one table, where a null `companyId` means predefined
  - `listRiskFactors(companyId)`, which returns predefined and own factors that aren't deleted
  - `riskCategoryLabels`
  - the `/risk-factors` page, which groups factors by category under "I." to "V." headings
  - the predefined and demo factors in the seeds

The demo templates in `docs/seed/demo.json` refer to factors by `factorName`, with an optional `exposureLevel`. The referral snapshot's `factors` (`src/lib/referral-pdf/snapshot.ts`) is `{ category, name, exposureLevel }[]`, and `create-referral` will fill it from a template.

## Goals / Non-Goals

**Goals:**
- Templates that `create-referral` can read as a list of live factors with their exposure levels.
- A plain server-rendered form with no client state, in line with the other features.

**Non-Goals:**
- Ordering a template's factors. The form shows them by category, and `create-referral` decides what order the PDF uses.
- A factor search or picker component. About 40 checkboxes fit on a desktop page.
- Showing factors that a template used to have before they were deleted.

## Decisions

### Schema

```prisma
model ReferralTemplate {
  id, companyId (relation to Company), name, createdAt, updatedAt, deletedAt DateTime?
  factors ReferralTemplateFactor[]
  @@unique([companyId, name], where: raw("deletedAt IS NULL"))
  @@index([companyId])
  @@map("referral_template")
}

model ReferralTemplateFactor {
  id, templateId (relation, onDelete: Cascade), riskFactorId (relation to RiskFactor), exposureLevel String?
  @@unique([templateId, riskFactorId])
  @@map("referral_template_factor")
}
```

This matches `docs/DATA-MODEL.md`. Join rows are hard-deleted when a factor is removed from a template, so they have no `deletedAt`. Templates are only ever soft-deleted, so `Cascade` only matters if one is ever hard-deleted. Check that the migration SQL has the `WHERE deletedAt IS NULL` clause, the same check the earlier changes made.

### A deleted factor disappears through a read filter

Every read of a template's factors filters on `riskFactor: { deletedAt: null }`. That covers the template's detail and the factor count on the list. Deleting a factor writes nothing to templates. The dead join row stays until the template is saved again. The edit form only offers live factors, so that save drops it.

**Alternative:** delete the join rows in `deleteRiskFactor`. Rejected: it changes the risk-factors service, and the read filter is needed anyway for consistency.

### Form encoding: one name per factor

Each visible factor gets a checkbox `factor-<id>` and a text input `exposure-<id>`. A pure function `readFactorSelection(formData)` in `src/features/templates/selection.ts` turns them into `{ riskFactorId, exposureLevel }[]`:
- It only reads checked factors.
- It trims exposure levels and turns empty ones into `null`.
- It returns unique IDs.

It has no `server-only` import, so it can be unit-tested.

Per-factor names, not a repeated `factorIds` field, because `formValues()` keeps one value per key. With per-factor names, a form shown again after an error keeps every checkbox and exposure level without any new helper.

`templateSchema` (zod) validates `{ name, factors }`:
- `name`: `requiredText(...).max(200)`
- `factors`: at least one, with the Polish message "Wybierz co najmniej jeden czynnik.", reported on the `factors` key
- each exposure level: at most 200 characters

### Allowed factors are checked in the service

Before saving, `ensureFactorsAvailable(ctx, ids)` counts the matching factors: `id in ids`, `deletedAt: null`, and `companyId` either null or `ctx.companyId`. If the count differs from `ids.length`, the save returns `{ factors: "Wybrane czynniki są niedostępne. Odśwież stronę i spróbuj ponownie." }`. Nothing is written. This is the trust boundary: form IDs come from the client.

**Accepted race:** a factor deleted between this check and the write ends up in a join row. The read filter hides it, so nobody sees it.

### Saving

- **Create:** `referralTemplate.create` with a nested `factors: { create: [...] }`.
- **Update:**
  1. `getTemplate` first. Another company's template, or a deleted one, gives `NotFoundError`.
  2. Then, in one `$transaction`: update the name, `deleteMany` the template's join rows, and `createMany` the new selection.
- **Unique violations:** a `P2002` from either path becomes `{ name: "Szablon o tej nazwie już istnieje." }`. The selection is already deduplicated, so the name is the only unique constraint that can fail.
- **Delete:** `updateMany` with the scope filter, the same as employees. `count === 0` → `NotFoundError`.

### Service API

`src/features/templates/service.ts`:
- `listTemplates(ctx)`: non-deleted templates, sorted by name, each with a count of its live factors (`_count` with a relation filter)
- `getTemplate(ctx, id)`: the template with its live factors (`riskFactorId`, `exposureLevel`, and the factor's `category` and `name`)
- `createTemplate`, `updateTemplate`, `deleteTemplate`

`create-referral` will call `getTemplate` to apply a template. The edit page uses it too, so nothing is added only for later.

### Pages

- `/templates`: a table with the name, the factor count and edit/delete actions, plus "Dodaj szablon".
- `/templates/new` and `/templates/[id]/edit`.

The form shows the name field, then one section per category, headed the same way as `/risk-factors`. Each row has a checkbox with the factor name and an "Wielkość narażenia (opcjonalnie)" input. `ROMAN` moves from the risk-factors page into `labels.ts` as `riskCategoryNumerals`, so both pages share it. The header gets "Szablony", shown under the same condition as "Pracownicy".

### Demo seed

`seed-demo.ts` creates each company's `templates` only when the company has no non-deleted templates, the same rule as for employees and factors. It runs after the company's own factors. Each `factorName` is resolved to a non-deleted factor that is either predefined or the company's own. A name that doesn't resolve throws, so a typo in the seed fails loudly. The rows then go through `templateSchema.parse`.

### Tests

- **Unit** (`selection.test.ts`):
  - unchecked factors are ignored, even with an exposure level filled in
  - exposure levels are trimmed and empty ones become null
  - no checked factor gives an empty list
- **Integration** (`src/features/templates.integration.test.ts`), on a migrated temporary database, with the predefined factors seeded:
  - create with a predefined and an own factor, then read it back with the exposure level
  - no factors rejected
  - another company's factor and a deleted factor rejected, with nothing written
  - edit replaces the selection
  - duplicate name rejected, and the same name allowed in another company and after deletion
  - a renamed own factor shows its new name
  - a deleted own factor disappears from the template and from the list count
  - another company's template is not found for get, update and delete
  - delete hides the template from the list and keeps the row
- **No e2e test.** `create-referral` covers templates in its flow.

## Risks / Trade-offs

- [`manage-risk-factors` isn't merged, and its API may still change] → Task 1 stops if it isn't on `main`. After that, re-read its service and labels before coding.
- [Migration order] → Create the migration only after rebasing onto that `main`.
- [Dead join rows remain until the template is saved again] → They're invisible through the read filter, and `create-referral` reads through `getTemplate`.
- [A long list of checkboxes] → Accepted for a desktop MVP with about 40 factors per company.

## Migration Plan

One additive migration (`manage_referral_templates`). The container applies it at start. Existing data isn't touched.
