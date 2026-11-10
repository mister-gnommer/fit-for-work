# Fit for Work

A web platform for creating and managing occupational medicine referrals (*skierowanie na badania lekarskie*). It connects Telemedi with HR teams at client companies whose insurance contract covers work medicine. HR enters employees, picks the risk factors for each job, and issues referrals as PDFs on the official form (Annex 3a to the 1996 Ministry of Health regulation, Dz.U. 2023 poz. 607). Telemedi handles them from there.

UI language: Polish. Desktop only.

## Setup

TBD. Everything runs in a single Docker container, with the SQLite file kept on a mounted volume.

## Tech stack

- Next.js (TypeScript)
- Prisma on SQLite. To move to PostgreSQL, you change the provider in the Prisma schema.
- Tailwind CSS and shadcn/ui
- Docker
- OpenSpec for spec-driven changes (`openspec/`)
- Better Auth for email and password login
- Playwright for end-to-end tests and for rendering PDFs with headless Chromium
- Vitest for unit and integration tests

## Core

The first goal: something that works end to end.

- **Accounts and roles.** There's one user table, and each user has a role:
  - *Telemedi*: not tied to any company. Sees every company and picks one from a switcher. Creates companies and each company's admin. The first Telemedi account is seeded at startup.
  - *Admin*: one per company, from HR. Creates the company's operators.
  - *Operator*: from HR. Can do everything within their own company.
- **Login.** Email and password.
- **Passwords.** Whoever creates an account sets its password, and can change it at any time. There's no self-service reset.
- **Companies.** Telemedi creates each company with the employer details printed on the form: name, address and NIP.
- **Employees.** A list plus a form with the data the referral needs, including the position, a work description and the home address (flat number optional). Within a company, each PESEL can appear only once.
- **Risk factors.** The five legal categories, each with seeded predefined items. Nobody can change the predefined items, not even Telemedi. Companies can add and edit their own items as plain text.
- **Referral templates.** Named sets of risk factors for a position or type of work, each factor with an optional exposure level. Templates reference factors, so if a company renames one of its factors, its templates pick up the new name.
- **Create referral.**
  - Pick an employee and the exam type (pre-employment, periodic or follow-up).
  - Optionally apply a template.
  - Adjust the position, the work description, the factors and their optional exposure levels.
  - "Employed" vs. "taking up work" is set from the exam type (pre-employment means taking up work) and can be overridden.
  - The place and date of issue come from the company's town and the creation date.
  - Set a deadline.
  - An employee can have more than one referral.
- **Frozen referrals.** A referral saves a snapshot of its data when it's created. Editing employees, factors or templates later doesn't change it.
- **Referral list.** Status, plus a PDF download. The PDF can also be downloaded right after the referral is created. It leaves space for a handwritten signature and stamp.
- **Statuses** are mocked for now: created, in progress, confirmed, done, cancelled. Only Telemedi can change them.
- **Deleting.** Every delete is a soft delete: the record is marked as deleted and disappears from the UI, but stays in the database.
  - Admins can delete operators.
  - Operators can delete their own account.
  - Operators can delete employees, templates and their company's own risk factors.
  - Predefined risk factors can't be deleted.
  - Only Telemedi can delete referrals and companies.
  - A deleted employee's referrals stay on the list.
  - Uniqueness rules (PESEL within a company, user email) ignore deleted records, and deleted accounts can't log in.
- **UI** uses Tailwind and shadcn/ui defaults.
- **Logging.** Errors go to the console.
- **Tests.**
  - Mostly unit tests, and only meaningful ones: nothing that just tests mocks.
  - A few broad integration tests.
  - At most five Playwright tests for the main flows.

Assumptions:

- About a few hundred companies with a few dozen employees each.
- Infrastructure is trusted. Data, including medical data, gets no extra encryption.
- Operators are sensible and careful.
- The app sends no emails or notifications.

What we deliberately won't build is listed in [docs/SCOPE-CUTS.md](docs/SCOPE-CUTS.md).

## Deferred

- Excel import of employees, using a simple template.
- Design work: dark mode, custom styling.
- One-time temporary passwords that the user has to change at first login.
- Stronger authentication: 2FA, OAuth and other providers, hardware keys.
- Login rate limiting and account lockout.
- Session management: expiry and "log out everywhere". Sessions use library defaults for now.
- Audit trail: who created, changed, deleted or downloaded what.
- Managing soft-deleted records: viewing and restoring them, and deleting them for good after a set time.
- Bulk actions, like creating referrals for many employees at once.
- Pagination, advanced search and sorting.
- Handling concurrent edits. For now, the last save wins.
- A warning when someone edits a risk factor that a template uses.
- Observability: metrics and structured logging.
- Data lifecycle: backups, versioning, revoking access.

### Open questions

- Can HR operators cancel a referral?
- Should we limit referrals per employee, for example to one open at a time?
