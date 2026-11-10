# Proposal

## Why

The repository contains decisions and research but no runnable application. Establish a reproducible development and container runtime so subsequent module changes can implement and test features immediately.

## What Changes

- Bootstrap a single Next.js App Router application with strict TypeScript, Tailwind and shadcn/ui defaults, showing a minimal Polish landing page.
- Configure Prisma with SQLite, a server-only shared client and migration commands; introduce no business tables or seed data yet.
- Provide npm scripts for development, production build/start, linting, type checking, database setup and tests. Pin direct dependencies to exact versions and commit the lockfile.
- Configure Vitest for Node-based unit/integration tests using real temporary SQLite databases, and Playwright for Chromium end-to-end tests.
- Package the app in one Docker container with SQLite on a mounted volume; document local and container commands.
- Leave authentication, company access, business modules, soft-delete rules, demo data and PDF rendering to their assigned changes. Chromium installation for browser tests is included; shipping a PDF runtime is not.

## Capabilities

### New Capabilities

- `application-runtime`: Run the Polish application locally and in one container, with server-only SQLite access and persistent container storage.
- `development-workflow`: Reproduce installation and run independent build, static-check, database and test commands from a documented checkout.

### Modified Capabilities

None; the main specification inventory is empty.

## Impact

- Adds the root package manifest/lockfile, application source, styling/component configuration, Prisma configuration, test configuration and Docker files.
- Adds Next.js/React, Prisma/SQLite, Tailwind/shadcn dependencies, Vitest and Playwright; no separate backend, queue or database service.
- Updates run instructions during implementation, preserving existing project documentation and OpenSpec integrations.
- Future account and module changes own their schemas, migrations, authorization and soft deletion. This change neither implements those rules nor creates placeholder entities for them.
