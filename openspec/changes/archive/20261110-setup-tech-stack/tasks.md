# Tasks

Apply in a dedicated worktree on branch `setup-tech-stack`, following AGENTS.md. Re-read shared docs immediately before editing them and preserve concurrent changes.

## 1. Application and UI

- [x] 1.1 Bootstrap the root npm/Next.js App Router project with strict TypeScript, `src/` paths and ESLint, preserving existing docs/OpenSpec/agent files and disabling automatic Git commits. Pin exact dependency/runtime versions and add the lockfile; verify `npm ci`, `npm run lint`, `npm run typecheck` and `npm run build` succeed.
- [x] 1.2 Initialize Tailwind and shadcn/ui defaults with only a component used by the Polish entry page; set document language to `pl` and use local/system fonts. Verify `/` displays the styled page without remote font requests or missing assets.
- [x] 1.3 Document runtime prerequisites, install, local development and production build/start commands in README Setup; verify the instructions match package scripts and preserve existing product requirements.

## 2. Database and integration checks

- [x] 2.1 Add pinned Prisma ORM 7, its SQLite adapter, the minimal generator/datasource schema, explicit client output and a server-only development singleton. Add environment examples and ignore rules; verify client generation, server-side `SELECT 1` against a temporary database and a production build without a live database.
- [x] 2.2 Add `db:generate`, `db:migrate` and `db:deploy` scripts; document shared CLI/app database paths and migration use. Verify deployment on a fresh temporary database and a repeated deployment with no pending migrations; introduce no placeholder business tables or destructive startup commands.
- [x] 2.3 Configure Node-based Vitest with a terminating `test` script and browser tests excluded. Add one real SQLite integration test that applies available migrations, writes through the application's exported database client, reconnects, reads the value and cleans up on success/failure. Verify `npm test` passes, catches an ignored DATABASE_URL and does not touch the development database.

## 3. Browser verification

- [x] 3.1 Configure pinned Playwright tooling with one Chromium desktop project, a managed isolated application server/port and `test:e2e`. Add one smoke test for the Polish entry page, document language and page errors; document browser/system-dependency installation and verify `npm run test:e2e` passes.

## 4. Container runtime

- [x] 4.1 Add a pinned Debian-based Node Dockerfile and `.dockerignore`; install native dependencies in-container, build the app and run as a non-root user. Add one-service Compose configuration with writable `/data` storage and migration-before-server startup. Verify the image builds, a fresh volume initializes, `/` serves successfully, and startup does not continue after migration failure.
- [x] 4.2 Document container build/start, database mount and container recreation commands. Using a disposable verification volume, write synthetic data through the configured database connection, recreate the container with the same volume and verify the value remains; remove the verification data/volume afterward without touching developer storage.

## 5. Whole-stack acceptance

- [x] 5.1 Follow the documented fresh-checkout workflow end to end: locked install, environment setup, client generation, lint, type checking, Vitest, Chromium smoke test, production build/start and Docker startup. Verify each command's exit status; check browser output contains no server database code/private values and Git changes contain no credentials, database files or generated artifacts.
