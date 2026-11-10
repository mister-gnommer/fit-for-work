# Design

## Context

On `main` (`2528112`):

| Piece | What exists |
|---|---|
| Referral form (`create-referral`) | Step 1 is a `GET` form for `employeeId`. Step 2 is `ReferralForm`, which submits through `onSubmit` to avoid React's reset and reads checked factors from repeated `factorIds` values and `exposure:<id>` inputs, returning them in `FormState.factorIds`. `createReferral(ctx, employeeId, input, now)` builds and freezes the snapshot. |
| Templates (`manage-referral-templates`) | `getTemplate(ctx, id)` returns a template's live factors (`riskFactorId`, `exposureLevel`, `riskFactor.{category,name}`), or `NotFoundError` for another company's or a deleted template. `listTemplates(ctx)`. `TemplateForm` renders the same kind of picker with `factor-<id>`/`exposure-<id>` names, read by `readFactorSelection` (unit-tested in `selection.test.ts`). `riskCategoryNumerals` is in `labels.ts`. |
| Demo seed | `seed-demo.ts` creates employees, factors and templates per company, each only when the company has none. |

`list-and-track-referrals` is in progress in another worktree. It changes `src/features/referrals/service.ts`, `/referrals/[id]` and the header.

## Goals / Non-Goals

**Goals:** applying a template with no client-side fetching, one factor picker, and demo referrals.

**Non-Goals:**
- storing `templateId` on referrals
- re-applying a template after the form is open without reloading the page
- changing `createReferral`'s signature or the referral service, which avoids conflicts with `list-and-track-referrals`

## Decisions

### Template chosen in step 1, applied by the server

Step 1 gets a second select, `templateId`: "Bez szablonu" plus `listTemplates(ctx)`. The `GET` form then goes to `/referrals/new?employeeId=…&templateId=…`. The page loads the template with `getTemplate(ctx, templateId)` (`NotFoundError` → error page) and passes `initial: Map<riskFactorId, exposureLevel | null>` to `ReferralForm`.

The form header shows "Szablon: <name>" with a "Zmień" link back to step 1 (`/referrals/new`). `ReferralForm` is keyed by employee and template, so a client-side navigation between step-2 URLs never keeps stale ticks. That bug showed up in the browser check when "Zmień" first pointed at `?employeeId=…`.

**Alternative: a template select on the open form that fills fields on the client.** Rejected: the page would need the template data up front or an extra fetch, and it would have to merge with edits already typed. Starting over from step 1 is simple and predictable.

### One shared picker, using the templates' field names

`src/components/factor-picker.tsx` is a client-agnostic component with no hooks:
- **Props:** `factors: PickerFactor[]` (`{ id, category, name, companyId: string | null }`, the `listRiskFactors` row shape, so pages pass rows unchanged), `isChecked(id): boolean` and `exposure(id): string`. Within a category, predefined factors come first.
- **Output:** one fieldset per category, headed `riskCategoryNumerals` and `riskCategoryLabels`. Each factor is a checkbox `factor-<id>` and an `Input` `exposure-<id>` with `maxLength={200}` and the aria-label "Wielkość narażenia: <name>". Own factors are marked "(własny)".
- **Both forms use it.**
  - `TemplateForm` keeps its own `checked` and `exposure` logic.
  - `ReferralForm`: `isChecked(id)` is `state.values ? "factor-" + id in state.values : initial.has(id)`, and `exposure(id)` comes from `state.values` first, then `initial`. This is exactly the template form's rule.
- **The referral action** uses `readFactorSelection(formData)`, mapped to `{ id, exposureLevel }` for `referralInputSchema`. That removes the `factorIds` and `exposure:<id>` handling and `FormState.factorIds` from `src/lib/forms.ts`.

`readFactorSelection` already keeps form order and trims exposure levels, and `selection.test.ts` covers it. The referral schema still enforces the 200-character exposure limit server-side.

### Demo referrals through the real builder

`demo.json`:
- The referral at `employeeIndex` 5 gets `"factors": [{ "factorName": "Mikroklimat zimny", "exposureLevel": "około 2 °C, część zmiany" }]`.
- The others keep `templateName`.

`seed-demo.ts` gets `ensureReferrals(companyId, demo)`. It runs after employees and templates, and only when the company has no referrals. For each demo referral, it:
1. Resolves the employee by the first and last name of `employees[employeeIndex]` in `demo.json`. Employees are inserted with one `createMany`, so their `createdAt` values are identical and can't give a reliable order.
2. Gets the factors from the template (`getTemplate`) or from the named list, resolved like `ensureTemplates` does: predefined or own, by name.
3. Calls `createReferral(ctx, employee.id, input)`. The context is the company's first operator, built like the integration tests' contexts. The input uses the employee's position and work description, `defaultEmploymentStatus(examType)`, and the demo deadline.
4. Sets the demo `status` with `db.referral.update`.

The seed calls the service directly, so the deadline rule (a form check) doesn't apply. Some demo deadlines may already be past, which is realistic for referrals that are done or cancelled.

**Alternative: write snapshots directly in the seed.** Rejected: they could drift from what the form produces. Going through `createReferral` also validates the snapshot.

## Risks / Trade-offs

- [The `TemplateForm` refactor could break templates] → Field names don't change, and `selection.test.ts` still applies. Check template create and edit in the browser (there is no template e2e test).
- [Merge with `list-and-track-referrals`] → This change doesn't touch `service.ts`, the summary page or the header. Conflicts should stay in `docs/` and maybe `seed-demo.ts` if that change adds referrals there too. Its proposal says it doesn't.
- [Changing the template means restarting step 2] → Acceptable. The template is the first thing the user picks.

## Migration Plan

No schema change. `db:seed:demo` on an existing demo database adds referrals only if the company has none.
