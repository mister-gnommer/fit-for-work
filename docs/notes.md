# Development notes

## OpenSpec changes (2026-11-10)

Build small, sequential changes: stack setup first, accounts/access second, then individual modules. Keep risk factors and templates separate. Each feature change includes its UI, persistence, validation, access checks and relevant tests.

| Order | Change | Scope |
|---|---|---|
| 1 ✅ | `setup-tech-stack` (archived 2026-11-10) | Next.js/TypeScript, Prisma/SQLite, Tailwind/shadcn, Vitest/Playwright tooling, Docker with persistent storage, run instructions. |
| 2 ✅ | `accounts-and-company-access` (archived 2026-11-10) | Login/logout, seeded Telemedi account, companies/employer details, admins/operators, password management, company switcher and server-side company/role boundaries. Soft delete of users and companies. Seeds the Telemedi account and demo companies from `docs/seed/`. |
| 2b ✅ | `render-referral-pdf` (in parallel with 2; archived 2026-11-10) | Referral snapshot type, HTML/CSS copy of the official form, PDF rendering with headless Chromium through Playwright, Chromium and a serif font with Polish characters in the Docker image. No database, auth or UI. |
| 3 | `manage-employees` | Employee list and create/edit form, identity validation, position, PESEL checksum and uniqueness within a company (among non-deleted employees). Soft delete. |
| 4 ✅ | `manage-risk-factors` (archived 2026-11-10) | Five categories, seeded read-only factors, company-owned factors with create/edit/soft-delete. Predefined list: `docs/seed/risk-factors.json`. |
| 5 | `manage-referral-templates` | List/create/edit templates referencing factors with optional exposure levels; factor edits appear on subsequent use. Soft delete. |
| 6 ✅ | `create-referral` (archived 2026-11-10) | Employee/exam selection, editable position/factors/exposures, deadline, required form fields, building, validating and saving the frozen snapshot, the download route, and immediate PDF download through the renderer from `render-referral-pdf`. Templates moved to 6b so this could run in parallel with `manage-referral-templates`. |
| 6b ✅ | `apply-referral-template` | After 5 and 6 are both merged: a template select on the referral form that pre-fills factors and exposure levels (via `getTemplate`), the demo referrals from `docs/seed/demo.json` (they name templates), and keeping one of the two factor pickers (templates vs. referral form). |
| 7 | `list-and-track-referrals` | Company referral list, existing PDF downloads, statuses and Telemedi-only status changes and deletes. |

`render-referral-pdf` was split out of referral creation so it can run in parallel with accounts: it needs no schema, auth or company scoping. It renders a PDF from a snapshot; `create-referral` builds the snapshot and wires in the download. Use `research/womp-referral-form.pdf` as the layout reference (omit its broken legislative footnote) and `research/referral-template/referral.html` as the HTML starting point. The PDF approach is recorded in `GRILLING-LEDGER.md`.

Propose each change shortly before implementation, using the completed work as context. Implement and verify it before moving to the next. Keep tests within each change; no separate backend/frontend/test changes or deferred-feature scaffolding.

This records the split discussed in this conversation, updated for the later Prisma and company-scoped PESEL decisions. `GRILLING-LEDGER.md` takes precedence for implementation decisions. Deletion rules (soft delete everywhere) are in `README.md` Core.
