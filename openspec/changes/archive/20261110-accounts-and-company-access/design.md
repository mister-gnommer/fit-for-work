# Design

## Context

Setup is in place: Next.js 16 App Router, Prisma 7.10.1 with the better-sqlite3 adapter, a server-only client at `src/lib/db.ts`, and an empty schema with no migrations. Vitest runs in Node, and Playwright starts `npm start` on port 3101 against whatever `DATABASE_URL` resolves to. Docker runs `db:deploy` and then `start`, and `docs/` is excluded from the image. `node_modules` isn't installed in the main checkout, so the Next.js guides in `node_modules/next/dist/docs/` must be read in the worktree before coding (AGENTS.md).

Product rules come from `README.md` Core, `docs/CONTEXT.md` and `docs/DATA-MODEL.md`. Behavior is in this change's specs.

## Goals / Non-Goals

**Goals:**
- One small set of access helpers that every later module reuses.
- Testable permission and validation rules as pure functions.
- Keep the Better Auth surface as small as possible.

**Non-Goals:**
- No Better Auth client SDK or HTTP auth endpoints.
- No middleware/proxy-based protection.
- No generic repository or service framework.
- No UI for Telemedi users managing other Telemedi users.

## Decisions

### Better Auth handles login and sessions only, called server-side

`src/lib/auth.ts` configures `betterAuth` with:
- `prismaAdapter(db, { provider: "sqlite" })`
- `emailAndPassword: { enabled: true, disableSignUp: true }`
- `nextCookies()` as the last plugin
- no user `additionalFields`. With no route handler, no Better Auth endpoint can write user fields, and the app reads `role`, `companyId` and `deletedAt` through Prisma in `getCurrentUser`. Better Auth ignores the extra columns. (The original plan declared them with `input: false`; that was dropped during implementation as unnecessary.)

Login and logout are Server Actions that call `auth.api.signInEmail` and `auth.api.signOut` with `await headers()`. Pages read the session with `auth.api.getSession`.

**No `/api/auth/[...all]` route handler.** Nothing in the UI needs it, and leaving it out avoids exposing endpoints such as `update-user`, `change-password` and `sign-up`. `disableSignUp` stays on as defense in depth.

**Alternative: Better Auth's `admin` plugin.** Rejected. It brings its own role, ban and impersonation model, which collides with our `Role` enum and adds columns and endpoints we'd have to lock down.

### Account creation and password setting go through our own code, using Better Auth's hasher

There's no sign-up endpoint, so `createUserWithPassword` runs in one Prisma transaction. It inserts:
- the `user` row, with a lowercased, trimmed email
- the credential `account` row: `providerId: "credential"`, `accountId: user.id`, and `password` hashed with `(await auth.$context).password.hash`

Setting a password hashes the new one, updates the credential account and deletes the user's `session` rows.

**Alternative:** keep sign-up enabled and call `auth.api.signUpEmail` from the server. Rejected: it would reopen the public endpoint, or need hooks to tell server calls from client ones. An integration test pins the account shape: a user created by our code must log in through `auth.api.signInEmail`.

### Deleted accounts are blocked at two points

1. `databaseHooks.session.create.before` loads the user and their company. If either is soft deleted, it returns `false`, so login fails. The login action shows the same generic message for every failure.
2. `getCurrentUser()` re-reads the user and company on every request, and returns `null` if either is deleted.

Soft-deleting a user also deletes their sessions, so they're logged out on their next request. Deleting a company only marks the company. Point 2 already blocks its users. Cookie caching for sessions stays off (library default), so every request checks the database.

### Access helpers: `src/lib/access.ts` (server-only)

| Helper | What it does |
|---|---|
| `getCurrentUser()` | `react` `cache()`d per request. Returns `{ id, name, email, role, companyId }` or `null`. |
| `requireUser()` | Redirects to `/login` when there's no user. |
| `requireTelemedi()` | Redirects to `/` for anyone who isn't Telemedi. |
| `requireCompanyContext()` | Returns `{ user, companyId }`. HR: their own `companyId`, never read from input. Telemedi: the `companyId` cookie, validated against companies that aren't deleted, otherwise a redirect to `/companies`. |

Every page and every Server Action calls one of them first. The page-level check doesn't protect actions, per the Next.js data-security guide.

The convention for all later modules: each query on a company-owned table includes `companyId: ctx.companyId` and `deletedAt: null`. A record looked up by ID uses `findFirst({ where: { id, companyId, deletedAt: null } })`, so another company's ID looks like "not found". A Prisma extension that adds the filter automatically was rejected as too much hidden behavior for a team new to Prisma.

### Pure permission rules plus thin services

`src/lib/permissions.ts` holds plain functions, unit-tested as a full role × target matrix:
- `canCreateUser(actor, role)`
- `canSetPassword(actor, target)`
- `canDeleteUser(actor, target)`

Each feature folder (`src/features/companies`, `src/features/users`) has:
- `service.ts`: takes an `actor`/`ctx` and validated input, checks permissions, writes through Prisma, and translates unique-constraint errors into Polish field errors.
- `actions.ts`: `"use server"` wrappers that resolve the context, parse `FormData`, call the service, then `revalidatePath`/`redirect`.

Integration tests call the services directly, with no Next.js request context.

### Validation with zod, pinned

Add `zod`, pinned exactly. The referral snapshot will also need a schema. Form schemas trim strings and return Polish messages to forms through `useActionState`. Keep the entered values on error, except the password. `src/lib/validation.ts` holds `isValidNip` and `normalizeNip` (weights 6,5,7,2,3,4,5,6,7; a remainder of 10 is invalid) and the postal-code pattern, with unit tests.

Passwords must be 8–128 characters, matching Better Auth's defaults, so its own checks never contradict ours.

### Schema and partial unique indexes via Prisma's `partialIndexes` preview

Write the four Better Auth models with the fields the pinned version expects. They were written by hand from `@better-auth/core`'s table definitions (`dist/db/get-tables.mjs`) rather than generated with the CLI. Better Auth signs in a credential account only when its `accountId` equals the user's id. Add:
- `Role` enum
- `User.role`, `User.companyId?`, `User.deletedAt?`
- `Company` (fields per DATA-MODEL)

Unique rules:
- `User`: `@@unique([companyId], where: raw("role = 'ADMIN' AND deletedAt IS NULL"))`
- `Company`: `@@unique([nip], where: raw("deletedAt IS NULL"))`
- `email` keeps Better Auth's plain unique index, so deleted users' emails stay taken.

Enable `previewFeatures = ["partialIndexes"]` (available since Prisma 7.4).

**Alternative:** hand-written raw SQL in the migration, as DATA-MODEL currently says. Rejected: Prisma doesn't know about those indexes and would generate `DROP INDEX` in later migrations. Update the DATA-MODEL convention in this change. If the preview misbehaves on SQLite (the generated SQL has no `WHERE`), fall back to raw SQL and note in DATA-MODEL that later migrations must be checked for dropped indexes.

The `role` column is the Prisma `Role` enum, which SQLite stores as TEXT. Better Auth sees it as a `string` additional field.

### Company switcher via an httpOnly cookie

The Telemedi switcher is a small client component, a native `<select>` that submits on change. It calls a Server Action that checks `requireTelemedi()` and an existing, non-deleted company, then sets the `companyId` cookie (httpOnly, SameSite=Lax, path `/`) and redirects to `/users`.

**Alternatives:**
- A URL segment (`/c/[companyId]/...`). Rejected: every route and link would carry it, HR users included, and every page would have to re-check it.
- A field on the Better Auth session. Rejected: it means writing to the library's session rows.

### Routes and UI

- `/`: redirects by role: `/login`, `/companies` (Telemedi) or `/users` (HR).
- `/login`
- The `(app)` route group's layout calls `requireUser()` and renders the header: product name, links (Telemedi: "Firmy"; everyone in a company context: "Użytkownicy"), the switcher for Telemedi, the user's name and role, and "Wyloguj".
- Telemedi pages:
  - `/companies` (list with edit/delete)
  - `/companies/new`
  - `/companies/[id]/edit`
- Company-context pages:
  - `/users` (list, actions by permission)
  - `/users/new` (the role select is shown only to Telemedi, and only offers Admin when the company has none)
  - `/users/[id]/password`

Deletes use a small client button with `window.confirm`. Polish role labels go in `src/lib/labels.ts`, the labels file later enums will share. Add shadcn components only as pages use them (button, input, label, table).

### Seeds

Both seeds use `createUserWithPassword` and are idempotent:
- `npm run db:seed` (`scripts/seed.ts`): creates the first Telemedi user from `TELEMEDI_NAME`, `TELEMEDI_EMAIL` and `TELEMEDI_PASSWORD` when no non-deleted Telemedi user exists. If the variables are missing, it logs an error and exits 0.
- `npm run db:seed:demo` (`scripts/seed-demo.ts`): reads `docs/seed/demo.json` and creates the Telemedi user, the companies (skipped if a non-deleted company has the NIP) and their admin and operators (skipped if the email exists). Later changes extend it with employees, factors, templates and referrals.

Scripts run with `tsx --conditions=react-server`, so `server-only` imports resolve, as in the setup test.

**Docker:**
- Startup becomes `db:deploy && db:seed && exec npm start`.
- `compose.yaml` passes `BETTER_AUTH_SECRET` (`${BETTER_AUTH_SECRET:?…}` so a missing value stops startup), `BETTER_AUTH_URL` and the Telemedi variables, interpolated from the host `.env`, which still isn't copied into the image.
- `.dockerignore` re-includes `docs/seed` so the demo seed can run with `docker compose exec app npm run db:seed:demo`.

### Tests

- **Unit:**
  - NIP and postal code
  - the permission matrix
  - the start-page-by-role mapping
- **One broad integration test** on a migrated temporary SQLite file, calling the services against real Better Auth:
  - create a company, admin and operator
  - log in through `auth.api.signInEmail`, including a mixed-case email
  - a second admin is rejected
  - duplicate NIP rejected, NIP of a deleted company allowed
  - a deleted email is not reusable
  - setting a password ends sessions and the new one works
  - deleted users and users of deleted companies can't log in
  - an admin acting on another company's user gets "not found"
- **Vitest config:** alias `server-only` to its empty module. Each test file sets `DATABASE_URL` and `BETTER_AUTH_SECRET` before dynamically importing app modules. Extract a temp-database helper from the existing `db.test.ts`.
- **E2E:** replace `home.spec.ts` with one login-flow test:
  - `/` goes to the Polish login page
  - a wrong password shows the generic error
  - Telemedi logs in, picks "Przykładowa Logistyka" in the switcher, and sees its users
  - logout goes back to the login page

  Playwright's `webServer.command` deletes and re-creates `tmp/e2e/app.db` with `db:deploy` and `db:seed:demo` before `npm start`, with `DATABASE_URL` and an auth secret set in `webServer.env`. That keeps setup ordering inside one command and away from `dev.db`.

## Risks / Trade-offs

- [Our user creation depends on Better Auth's credential-account shape] → Pin the version exactly. The integration test logs in a user created by our code. Re-run it on every upgrade.
- [`partialIndexes` is a preview feature] → Check the generated migration SQL contains `WHERE`. If it doesn't, use the documented fallback.
- [A rejected session hook might give a different error from wrong credentials] → The login action maps every failure to one generic message.
- [The cookie switcher can go stale or be tampered with] → It's validated on every read, and an invalid value counts as no selection. It only matters for Telemedi, who may access every company anyway.
- [`window.confirm` is crude] → Acceptable for the MVP. Shadcn dialogs come with design work (Deferred).
- [The `tsx` devDependency is used at container start] → The image already installs every dependency (setup decision). Revisit with image slimming.
- [Better Auth 1.7.19 was published today] → Pin the latest 1.7.x patch that is at least a few days old unless a fix is needed.

## Migration Plan

This is the first real migration: `npx prisma migrate dev --name accounts_and_company_access` in the worktree. Existing Docker volumes hold only an empty migrated database. `db:deploy` applies the new migration on the next start, and `db:seed` creates the Telemedi user. Rollback: redeploy the previous image with a fresh volume, since there is no production data yet.
