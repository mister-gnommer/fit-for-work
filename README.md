# Fit for Work

A web platform for creating and managing occupational medicine referrals (*skierowanie na badania lekarskie*). It connects Telemedi with HR teams at client companies whose insurance contract covers work medicine. HR enters employees, picks the risk factors for each job, and issues referrals as PDFs on the official form (Annex 3a to the 1996 Ministry of Health regulation, Dz.U. 2023 poz. 607). Telemedi handles them from there.

UI language: Polish. Desktop only.

## Setup

Use Node.js 24.14.1 (`nvm use`) and npm 11.11.0.

```sh
npm ci
cp .env.example .env   # then set BETTER_AUTH_SECRET (openssl rand -base64 32) and TELEMEDI_PASSWORD
npm run db:generate
npm run db:deploy
npm run db:seed        # predefined risk factors + first Telemedi account from TELEMEDI_* in .env
npm run db:seed:demo   # optional: demo companies, accounts, employees, factors, templates and referrals
npm run dev
```

Open http://localhost:3000 and log in. To check and run a production build:

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

### Database and tests

Run commands from the project root. `DATABASE_URL` defaults to `file:./dev.db`; both Prisma's CLI and the application use that file in the project root. Override it with an absolute `file:/...` URL for another location. Keep the database and its sidecar files outside `public/`.

- `npm run db:generate` regenerates the ignored Prisma client.
- `npm run db:migrate -- --name <change-name>` creates and applies a development migration after changing the schema.
- `npm run db:deploy` applies committed migrations without changing the schema.
- `npm run db:seed` adds any missing predefined risk factors from `docs/seed/risk-factors.json`, and creates the first Telemedi account from `TELEMEDI_NAME`, `TELEMEDI_EMAIL` and `TELEMEDI_PASSWORD` when none exists. It never changes or removes existing records.
- `npm run db:seed:demo` loads the synthetic demo data from `docs/seed/demo.json`, including 5 referrals in every status for Przykładowa Logistyka. Running it again changes nothing.
- `npm test` runs Vitest once. Integration tests use disposable SQLite databases and never reset `dev.db`. The referral PDF test needs Chromium (below).

Demo logins after `db:seed:demo`, all with the password `Demo123!haslo`:

- Telemedi: `telemedi@example.com`
- Przykładowa Logistyka: `admin.logistyka@example.com`, `operator1.logistyka@example.com`, `operator2.logistyka@example.com`
- Demo Budowa: `admin.budowa@example.com`
- Przykładowe Usługi Rolnicze: `admin.rolnicze@example.com`

Install Chromium before running `npm test` or the browser smoke test. Referral PDFs use the Liberation Serif font (`fonts-liberation` on Debian/Ubuntu, `liberation-serif-fonts` on Fedora); without it, another serif font is used.

```sh
npm exec -- playwright install chromium
npm test
npm run test:e2e
```

On supported Debian/Ubuntu hosts, use `npm exec -- playwright install --with-deps chromium` to install missing system libraries too. `test:e2e` builds the app and starts its own production server on port 3101; keep that port free. It does not reuse your development server. The server runs on its own database, `tmp/e2e/app.db`, which is rebuilt with the demo data on every run, so `dev.db` is never touched.

### Docker

With Docker Engine and Compose available, put `BETTER_AUTH_SECRET` and the `TELEMEDI_*` values in the host's `.env`. Compose reads them for interpolation and refuses to start without the secret. Set `BETTER_AUTH_URL` if the app isn't served at http://localhost:3000.

```sh
docker compose up -d --build
docker compose logs app
```

Open http://localhost:3000. The container runs as a non-root user, applies committed migrations, adds the predefined risk factors and creates the first Telemedi account before starting, and stores SQLite at `/data/app.db` on the named `app-data` volume. No host `.env` is copied into the image.

```sh
docker compose exec app npm run db:seed:demo   # optional demo data; run after `logs app` shows "Ready"
docker compose up -d --force-recreate
docker compose down
```

Recreating the container or running `down` preserves the named volume. The image includes the Chromium headless shell and Liberation Serif for rendering referral PDFs; browser binaries for tests on the host are installed separately.

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
  - A deleted employee's PESEL can be used again. A deleted user's email can't, and the account can't log in.
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
- Should referrals get a human-readable number, like "SKR/2026/0001"?
