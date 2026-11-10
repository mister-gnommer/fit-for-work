# Proposal

## Why

Templates exist so HR doesn't tick the same factors and exposure levels for every warehouse worker or driver. But the referral form can't use them yet: `create-referral` and `manage-referral-templates` were built in parallel, and applying a template was left to this follow-up (6b in `docs/notes.md`). The demo also has no referrals, because `docs/seed/demo.json` defines them by template name.

## What Changes

- **Choose a template in step 1.** Step 1 of `/referrals/new` gets an optional "Szablon" select next to the employee: "bez szablonu" plus the company's templates. With a template chosen, the form opens with that template's factors ticked and their exposure levels filled in. Factors that were deleted since are skipped. Everything stays editable. The form shows which template was applied, with a link back to step 1 to change it.
- **The template only affects the factors.** Position and work description still come from the employee. The referral doesn't record which template was used: the snapshot holds what was submitted.
- **One factor picker.** The template form and the referral form currently each render "factors by category, each with a checkbox and an exposure level". A shared `FactorPicker` component replaces both, using the templates' field names (`factor-<id>`, `exposure-<id>`) and their existing `readFactorSelection`. The referral form's own numerals copy and the `FormState.factorIds` field added by `create-referral` go away. The only visible change: the template form now also marks own factors "(własny)" and lists predefined factors first in each category, like the risk-factor page.
- **Demo referrals.** `npm run db:seed:demo` creates the presentation company's 5 referrals from `docs/seed/demo.json`:
  - through the same snapshot builder as the form, with the template's factors, or the referral's own `factors` list
  - with each referral's demo status and deadline
  - created by the company's first operator
  - only when the company has no referrals yet

  The one demo referral without a template (`employeeIndex` 5, a warehouse worker who spends part of each shift in a 2 °C cold store) gets an explicit `factors` list in `demo.json`: "Mikroklimat zimny" with the exposure level "około 2 °C, część zmiany". A referral needs at least one factor, and the seed data then says so itself instead of relying on a hidden rule.

Out of scope: remembering the template on the referral, applying a template after the form is open without reloading, and anything in `list-and-track-referrals` (list, statuses, deleting).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `referral-creation`: adds applying a template when starting a referral, and the demo referrals. The existing requirements are unchanged.

## Impact

- **Changed code:**
  - `src/app/(app)/referrals/new/page.tsx`: the template select, and loading the template with `getTemplate`
  - `src/features/referrals/referral-form.tsx` and `actions.ts`: the shared picker and `readFactorSelection`
  - `src/features/templates/template-form.tsx`: the shared picker
  - `src/lib/forms.ts`: `factorIds` removed
  - `scripts/seed-demo.ts` and `docs/seed/demo.json` (the one explicit factor list)
- **New code:** a shared `FactorPicker` component.
- **No schema change.**
- **Parallel work:** `list-and-track-referrals` is changing `src/features/referrals/service.ts`, the referral summary page and the header. This change touches none of those, apart from reading `createReferral` from the seed.
- **Tests:**
  - the referral e2e test starts from a template
  - one integration assertion that the demo seed's referrals snapshot their templates' factors
  - the existing template tests keep covering the picker's field names
