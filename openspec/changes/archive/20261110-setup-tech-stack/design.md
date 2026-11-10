# Design

## Context

See `proposal.md` for motivation. The repository has no application manifest, source or tests. `docs/GRILLING-LEDGER.md` selects App Router, server components for reads, Server Actions for writes, Better Auth/Prisma, Vitest with real SQLite integration tests, and Playwright for browser tests and later PDF generation. Current README/CONTEXT also put soft deletion in core; the deletion ambiguity in `docs/notes.md` is stale. None of those business behaviors belongs in this setup change.

## Goals / Non-Goals

**Goals:** A clean checkout can run, build, query SQLite, run checks and start in Docker. Establish only the conventions immediately exercised by this skeleton.

**Non-Goals:** Business schemas, seed data, authentication, tenant scoping, deletion, PDF rendering, CI pipelines, events, CQRS and repository interfaces. Do not create empty module folders or install Better Auth until the accounts change uses it.

## Decisions

### One application, npm and conventional source paths

Use npm with `package-lock.json`, strict TypeScript and the `@/*` alias pointing to `src/`. Use `src/app/` for routes/layout, `src/components/ui/` for shadcn components and `src/lib/` for shared infrastructure. Feature directories appear when features are implemented. This keeps the native Next.js programming model without a separate API service or generic service layer.

Choose a supported Node 24 release and compatible stable package releases during implementation; record exact direct versions, runtime version and lockfile. No canary packages, dependency ranges or unversioned scaffolding commands. Scaffold carefully into this populated repository, preserving docs and agent integrations and disabling automatic Git initialization/commits.

### Minimal Polish page and default UI setup

Set document language to `pl`, use Tailwind/shadcn defaults and render a simple product heading with Polish explanatory text. Add only a component the page uses, such as Card. Use system fonts; skip remote font fetching, custom design, navigation for unimplemented modules and dark-mode controls.

### Prisma with no placeholder business models

Use stable Prisma ORM 7 with `@prisma/adapter-better-sqlite3`, an explicit generated-client output under `src/generated/`, and the Prisma 7 CLI config filename supported by the exact pinned release. The database URL lives in environment/config, not inside the schema. Put a server-only client in `src/lib/db.ts`; cache it across development reloads. Keep the schema at generator/datasource configuration until accounts supplies the first real models.

Provide `.env.example` and ignore local environments, SQLite files/sidecars, generated client and build/test artifacts. Use the same absolute SQLite URL for CLI and app in Docker (`file:/data/app.db`); document local resolution to avoid accidentally opening two files. Provide generation, development migration and deployment migration scripts. Empty-schema generation and deployment with no pending migrations must be exercised; do not add a dummy production table just to make setup tests pass. Generate before checks/build and avoid database connections during static page compilation.

### Two useful smoke checks

Configure Vitest in the Node environment and exclude browser tests from its discovery. Add one integration test that runs repository migrations against a unique temporary SQLite file (initially no application migrations), writes a synthetic value through the application's exported client and reads it through a separate connection. Run the application client in a fresh Node process with the `react-server` condition and a temporary working directory; this isolates its cached client/environment and keeps a broken relative URL away from developer data. Close clients before cleanup, including on failure. No trivial unit test is needed yet.

Configure Playwright with one Chromium desktop project and its managed `webServer`, targeting an explicitly isolated server/port. One browser test verifies the Polish entry page, document language and absence of application page errors. It uses no production data. Default test scripts run once; provide separate browser installation instructions. Later features consume the remaining four end-to-end slots.

### Straightforward Docker packaging

Use a Debian Bookworm Node image compatible with the SQLite native adapter and Playwright; pin the exact Node image release during implementation. Build the application and run its production server as a non-root user. Keep installed dependencies, including the Prisma CLI, in this first image rather than adding standalone tracing and migration packaging complexity. Accept a larger image for the MVP.

Provide a Compose file with one app service, one named volume mounted at `/data`, a writable database directory and startup that applies deployment migrations before serving. Failure to apply migrations must stop startup; never use destructive resets or `db push` there. Do not install PDF Chromium/fonts in the runtime yet; the referral/PDF change owns them. Browser-test dependencies can be installed for verification separately.

## Risks / Trade-offs

- Native SQLite binaries depend on the Node/OS combination → install/build inside the selected Debian image; do not copy host `node_modules`.
- Prisma generation and migration behavior varies by release → verify the pinned version's empty-schema workflow; the first domain change owns the first real migration.
- A later PostgreSQL move is more than a provider edit, particularly with raw partial indexes → no portability claim or extra abstraction in this change.
- Runtime package tracing/pruning can omit the migration CLI or native adapter → keep the complete install for now.
- Existing notes still describe deletion as unresolved → use the updated README/CONTEXT; implement deletion with each owning module, not setup.

## Migration Plan

This is the first runtime; there is no existing application data to migrate. During implementation, document clean install, environment creation, browser installation, development startup, all verification commands and `docker compose up --build`. Verify that synthetic test data survives recreating the container with the same volume. Keep test-only tables out of the application schema and remove verification data afterward. Reverting setup files does not require deleting the mounted database volume.

## References

- [Prisma ORM 7 SQLite setup](https://www.prisma.io/docs/v7/prisma-orm/quickstart/sqlite)
- [Next.js Docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [shadcn Next.js setup](https://ui.shadcn.com/docs/installation/next)
- [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Playwright Docker guidance](https://playwright.dev/docs/docker)
