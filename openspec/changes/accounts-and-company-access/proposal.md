# Proposal

## Why

Every later module (employees, risk factors, templates, referrals) belongs to one client company and is used by that company's HR or by Telemedi. The app has no users, companies or access rules yet. This change adds them so later changes only have to call one access helper.

## What Changes

- Email and password login and logout with Better Auth. There's no public sign-up, no self-service reset and no email.
- Three roles: `TELEMEDI` (no company), `ADMIN` (one per company) and `OPERATOR`.
- On startup, the first Telemedi account is created from environment variables if none exists.
- Telemedi creates, edits and soft deletes companies with the employer details printed on the form: name, address and NIP (checksum-validated, unique among companies that aren't deleted).
- Telemedi picks the working company from a switcher in the header and then sees exactly what that company's HR sees.
- Company users page:
  - Telemedi creates the company's admin when it has none, creates operators, sets any user's password and deletes any user.
  - The admin creates operators, sets their passwords and deletes them.
  - An operator can delete their own account.
  - Passwords are set by whoever creates or manages the account.
- Deleted users, and users of deleted companies, can't log in, and their sessions end.
- Server-side access helpers: the current user, a Telemedi-only guard and the company context. Every page and Server Action uses them, and later modules scope every query with the company context's `companyId`.
- Polish UI shell: header with the user's name, the company switcher (Telemedi only) and logout.
- `/` now sends logged-out users to the login page and logged-in users to their start page.
- `npm run db:seed:demo` loads the Telemedi user, the companies and their accounts from `docs/seed/demo.json`. Employees, factors, templates and referrals are added by their own changes.
- Browser tests run against their own seeded temporary database.

Out of scope: one-time passwords, users changing their own password, managing Telemedi accounts, login rate limiting, session management, restoring deleted records and audit trails (README Deferred and `docs/SCOPE-CUTS.md`).

## Capabilities

### New Capabilities

- `user-accounts`: login and logout, roles, seeding the first Telemedi account, creating company users, setting passwords, soft-deleting users and blocking deleted accounts.
- `company-management`: Telemedi managing companies and their employer details, the company switcher, and keeping each company's data separate.

### Modified Capabilities

- `application-runtime`:
  - The `/` entry page becomes a redirect to login or to the start page.
  - An empty volume starts with the Telemedi account taken from the environment.
  - The runtime needs an auth secret.
- `development-workflow`:
  - Browser tests use an isolated seeded database.
  - A documented demo-data command is added.

## Impact

- **Dependencies:** `better-auth`, pinned to an exact version.
- **Prisma schema:**
  - The first real models: `User`, `Session`, `Account`, `Verification`, `Company` and the `Role` enum.
  - The first migration.
  - The `partialIndexes` preview feature, which replaces the raw-SQL convention in `docs/DATA-MODEL.md`.
- **New code:**
  - `src/lib/auth.ts`, the access helpers, permission rules and validation (NIP, postal code).
  - Server Actions and pages for login, companies and users.
  - The Better Auth route handler.
  - Seed scripts.
- **Environment:** `.env.example`, `compose.yaml` and Docker startup gain `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and the Telemedi seed variables. Startup runs the seed after migrations.
- **Tests:** the existing home e2e test is replaced by a login-flow test, and Playwright gets a global setup that prepares a temporary database.
- **Docs:** README (setup, env, demo logins) and `docs/DATA-MODEL.md` (the partial-index convention).
