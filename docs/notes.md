# Development notes

## OpenSpec changes (2026-11-10)

Build small, sequential changes: stack setup first, accounts/access second, then individual modules. Keep risk factors and templates separate. Each feature change includes its UI, persistence, validation, access checks and relevant tests.

| Order | Change | Scope |
|---|---|---|
| 1 | `setup-tech-stack` | Next.js/TypeScript, Prisma/SQLite, Tailwind/shadcn, Vitest/Playwright tooling, Docker with persistent storage, run instructions. |
| 2 | `accounts-and-company-access` | Login/logout, seeded Telemedi account, companies/employer details, admins/operators, password management, company switcher and server-side company/role boundaries. |
| 3 | `manage-employees` | Employee list and create/edit form, identity validation, position, PESEL checksum and uniqueness within a company. Deletion remains unresolved. |
| 4 | `manage-risk-factors` | Five categories, seeded read-only factors, company-owned factors with create/edit operations. |
| 5 | `manage-referral-templates` | List/create/edit templates referencing factors with optional exposure levels; factor edits appear on subsequent use. |
| 6 | `create-referral-and-pdf` | Employee/exam selection, optional template, editable position/factors/exposures, deadline, required form fields, frozen snapshot and immediate PDF download. |
| 7 | `list-and-track-referrals` | Company referral list, existing PDF downloads, statuses and Telemedi-only status changes. |

Keep PDF generation with referral creation so that change produces a usable document. Use `research/womp-referral-form.pdf` as the layout reference; omit its broken legislative footnote. The PDF approach is recorded in `GRILLING-LEDGER.md`.

Propose each change shortly before implementation, using the completed work as context. Implement and verify it before moving to the next. Keep tests within each change; no separate backend/frontend/test changes or deferred-feature scaffolding.

This records the split discussed in this conversation, updated for the later Prisma and company-scoped PESEL decisions. `GRILLING-LEDGER.md` takes precedence for implementation decisions. Employee deletion was questioned but not confirmed.
