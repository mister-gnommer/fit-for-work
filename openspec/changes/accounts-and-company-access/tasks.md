# Tasks

## 1. Dependencies and schema

- [x] 1.1 Read the auth, forms and data-security guides in `node_modules/next/dist/docs/` (AGENTS.md). Pin `better-auth` (latest 1.7.x patch, at least a few days old) and `zod` exactly, without `^` or `~`. Verify with `npm ci` and `npm run typecheck`.
- [x] 1.2 Add the Better Auth models (generated once with the version-matched CLI, then edited), the `Role` enum, user `role`/`companyId`/`deletedAt`, the `Company` model and both partial unique indexes behind `previewFeatures = ["partialIndexes"]`. Create the migration `accounts_and_company_access`. Verify the migration SQL contains both `WHERE` clauses, otherwise apply the design fallback.
- [x] 1.3 Update `docs/DATA-MODEL.md` conventions: partial unique indexes are declared in the schema with `partialIndexes`, not raw SQL. Note the fallback if it was used. Verify by reading the diff against the schema.

## 2. Validation and permission rules

- [x] 2.1 Add `src/lib/validation.ts` with NIP normalisation and checksum and the postal-code check. Verify with unit tests for separators, a wrong checksum, a remainder of 10, wrong length and the seed NIPs.
- [x] 2.2 Add `src/lib/permissions.ts` (`canCreateUser`, `canSetPassword`, `canDeleteUser`), the start-page-by-role function and the Polish role labels in `src/lib/labels.ts`. Verify with a role × target unit-test matrix covering self, same company, other company and Telemedi targets.

## 3. Auth and access helpers

- [x] 3.1 Add `src/lib/auth.ts` per design: Prisma adapter, sign-up disabled, no user `additionalFields` (see design), a session-create hook blocking deleted users and companies, `nextCookies()` last, and no route handler. Add `createUserWithPassword` and `setUserPassword`, which also ends sessions. Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and the `TELEMEDI_*` variables to `.env.example` with placeholder values. Verify with `npm run typecheck`.
- [x] 3.2 Add `src/lib/access.ts` (`getCurrentUser`, `requireUser`, `requireTelemedi`, `requireCompanyContext` with the validated `companyId` cookie). Verify with `npm run typecheck`. Behavior is covered in 4.4.
- [x] 3.3 Set up integration testing: alias `server-only` in `vitest.config.ts`, and extract a migrated temp-database helper from `src/lib/db.test.ts`, keeping that test passing. Verify with `npm test`.

## 4. Companies and users (services, actions, pages)

- [x] 4.1 Add the companies feature: zod schema, service (create, edit, soft delete; Telemedi only; duplicate NIP turned into a Polish field error), actions and the pages `/companies`, `/companies/new`, `/companies/[id]/edit` with delete confirmation. Verify manually against the `company-management` scenarios in the dev server.
- [x] 4.2 Add the users feature: service (create with the role rules, set password, soft delete with session removal, deleting yourself logs you out), actions and the pages `/users`, `/users/new`, `/users/[id]/password`. Verify manually against the `user-accounts` scenarios.
- [x] 4.3 Add the `(app)` layout header (links, switcher for Telemedi, name and role, logout), `/login` with the generic error, `/` role redirect, and the switcher action setting the cookie. Add only the shadcn components used. Verify manually: log in as each demo role and switch company.
- [x] 4.4 Write one broad integration test of the services against real Better Auth on a temporary database, covering every case listed under Tests in design.md. Verify with `npm test`.

## 5. Seeds, runtime and docs

- [x] 5.1 Add `scripts/seed.ts` (first Telemedi from env, idempotent; missing env logs an error and exits 0) and `scripts/seed-demo.ts` (accounts and companies from `docs/seed/demo.json`, idempotent), plus the `db:seed` and `db:seed:demo` npm scripts. Verify by running each twice on a fresh database and seeing the same user and company counts, then logging in as `telemedi@example.com`.
- [x] 5.2 Update the Dockerfile CMD (`db:deploy && db:seed && start`), `compose.yaml` env (required `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TELEMEDI_*`) and `.dockerignore` (re-include `docs/seed`). Verify:
  - `docker compose up -d --build` on a new volume lets the env Telemedi user log in
  - a missing secret stops startup
  - `docker compose exec app npm run db:seed:demo` works

  Result (2026-11-10): **Docker check passed**, run by the user (`sudo docker compose -p ffw-accounts …`):
  - the build succeeded and a new volume was created
  - startup applied the migrations, created the Telemedi account from env and reached Ready
  - `db:seed:demo` through `exec` created the 3 demo companies
  - the env Telemedi user logged in and saw the company list
  - `compose config` without a secret fails with "Set BETTER_AUTH_SECRET in .env"
  - the test project was removed with `down -v`

  An earlier Podman run (build, volume persistence, exit code 1 without a secret) was only a preliminary check. Don't repeat the Docker check for this change.
- [x] 5.3 Replace `tests/e2e/home.spec.ts` with the login-flow test. Make Playwright's `webServer.command` rebuild `tmp/e2e/app.db` (deploy plus demo seed) with `DATABASE_URL` and the secret in `webServer.env`. Verify that `npm run test:e2e` passes and `dev.db` is unchanged (compare its checksum before and after).
- [x] 5.4 Update `README.md`: the env variables in Setup, `db:seed`/`db:seed:demo`, demo logins, and the Docker secret. Update the `docs/CONTEXT.md` project state. Verify the documented commands run as written on a fresh clone of the worktree.

## 6. Final checks

- [x] 6.1 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run test:e2e`. All of them must pass. Then grep `.next/static` for the secret and the seed passwords: no matches.

## Workflow follow-up

- Implement in a worktree on branch `accounts-and-company-access` (AGENTS.md).
- Verify with `/opsx:verify`, merge, then archive with `/opsx:archive`.
