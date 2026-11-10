# Fit for Work

Greenfield project built during Telemedi's on-site trial day on 2026-11-10: a platform for managing occupational health examination referrals (Polish: „skierowania na badania medycyny pracy”). The task brief and clarifications from the team define the scope; detailed requirements are still to be recorded.

## Company context

Telemedi provides telemedicine and healthcare services for patients and business partners, including insurers. Its platform supports access to medical services, eligibility checks and appointment booking. The engineering team works closely with product and operations, delivering features end to end with AI-assisted development.

The job description lists PHP/Symfony, React/TypeScript, Node.js, Python, relational databases and messaging infrastructure. These describe Telemedi's existing environment, not a prescribed stack for this greenfield task.

## Working priorities

- Clarify users, referral workflow and acceptance criteria before implementing; record assumptions and agreed scope cuts.
- Deliver a small, working end-to-end flow first, then expand against the task requirements.
- Keep the architecture simple and decisions easy to explain. Review and understand AI-generated code.
- Validate inputs, enforce access boundaries and handle errors and state changes explicitly. Use synthetic personal and medical data for development and demos.
- Test important business rules and failure cases; leave clear run instructions and note remaining limitations.

## Handover (as of 2026-11-10)

Product summary, stack, core vs deferred: `README.md`. Agent rules: `AGENTS.md`. Legal facts about the referral form: `docs/research/` (always use these, not memory). This section holds the rest: decisions, unconfirmed proposals and open questions from the requirements session with the user.

### Glossary

- *Skierowanie (na badania lekarskie)*: referral for an occupational medical examination. Called "referral" in code and docs.
- Exam types: *wstępne* (pre-employment), *okresowe* (periodic), *kontrolne* (follow-up).
- *Czynniki szkodliwe / narażenie*: risk factors / exposure. *Wielkość narażenia*: exposure level.
- *Stanowisko*: job position. *Pracodawca*: employer (the client company).
- Template: a named, reusable set of risk factors for a position or type of work. It's a data preset, not a PDF layout.

### Decided by the user

- Parties: Telemedi ↔ client companies. Each company has a contract with an insurer that covers work medicine, and Telemedi handles the referrals.
- Users: only the client's HR and Telemedi. Employees never log in.
- Roles: per company, one admin and many operators. Operators all have the same permissions and can do everything within their company. The only extra thing the admin can do is create operators. Telemedi has full access to everything.
- Passwords (core): whoever creates an account sets its password, and can change or reset it at any time. There's no self-service and no email. Deferred: one-time temporary passwords the user must change at first login.
- Modules:
  1. Admin panel and accounts.
  2. Employees: form now, Excel import deferred.
  3. Risk factors: 5 legal categories with predefined items. Companies add their own items as plain strings and can't edit the predefined ones.
  4. Templates.
  5. Create referral: pick an employee, optionally apply a template and edit it, set a deadline. The employer sets the deadline, which tells Telemedi when the referral is due.
  6. Referral list: status and PDF download. The PDF can also be downloaded right after creation.
- Statuses are mocked: created, in progress, confirmed, done, cancelled.
- Polish UI. Desktop only. No emails or notifications. Infrastructure is trusted, so no extra encryption, even for medical data. Scale: a few hundred companies with a few dozen employees each. Assume sensible operators.
- Stack: Next.js, Prisma and SQLite. The plan is to switch to Postgres by changing the Prisma provider. Tailwind with shadcn/ui defaults, Docker (one container, SQLite on a volume) and OpenSpec. The user first considered TypeORM, which they know, and then picked Prisma because it fits Next.js better. Prisma is new to them, so keep Prisma code plain and conventional.
- Logging: `console` for errors.
- Deferred: Excel import, dark mode and design, 2FA/OAuth/hardware keys, metrics and structured logging, backups, versioning, soft deletes and revoking access.

### Research findings (details in `docs/research/`)

- The form is Annex 3a to the 1996 Ministry of Health regulation (consolidated text Dz.U. 2023 poz. 607, PDF p. 28). The 2026 amendments (poz. 456, 726) don't change it.
- The form has **no checkboxes**. Each of the 5 categories (physical factors, dusts, chemical factors, biological factors, other factors incl. hazardous) is a free-text block that takes the factor name plus the exposure level. Selecting factors only happens in our UI. The PDF prints the selected factors as text under their category.
- Predefined items (5–7 per category) are suggestions taken from Annex 1. `risk-factors.md` flags one label as unverified.
- Employee data: full name, PESEL. Without a PESEL: ID document series, number and name, plus date of birth for candidates. Also sex, because the form strikes through gendered wording.
- Employer details (name, address) and the exam type also go on the form. "Total number of factors" is calculated. Store the referral's issue date, because the medical certificate cites it.

### Confirmed in the second round (2026-11-10)

- Telemedi users: role `telemedi` with no company. They switch between companies in the header and see exactly what that company's HR sees. They create companies, including the employer details printed on the form (name, address, NIP), and company admins. The first Telemedi user is seeded from env. One `users` table with a `role` and a nullable `company_id`, and every query is scoped by company.
- Exposure level: an optional free-text field on each selected factor, stored on the template and editable on the referral. The official form asks for it. The Telemedi team said names alone are enough, and that variants like "driving 4 h/day" and "driving 6 h/day" can be separate items. Both approaches work.
- Exam type is a select on the referral form.
- Predefined risk factors are seeded and read-only for everyone, Telemedi included. Companies add and edit their own items, as plain strings.
- Templates reference factors. Editing a company factor changes every template that uses it, starting with its next use. Deferred: a warning when you edit a factor that a template uses.
- Referrals are frozen. Save a JSON snapshot when the referral is created and render the PDF from it. Later edits to employees, factors or templates don't change existing referrals.
- Only Telemedi changes referral statuses.
- PESEL is unique within a company, enforced by a composite unique constraint on `(company_id, pesel)`. The same person can be an employee of two companies.
- Login rate limiting is deferred. Multiple referrals per employee are allowed.
- Signature and stamp: leave blank space on the PDF and sign by hand.
- Deleting (core): everything uses soft delete, meaning a `deleted_at` column and hidden everywhere in the UI.
  - Admins can delete operators.
  - Operators can delete their own account, employees, templates and their company's own risk factors.
  - Predefined risk factors can't be deleted.
  - Only Telemedi can delete referrals and companies.
  - A deleted employee's referrals stay on the list, because their snapshot holds all the data they need.
  - Unique PESEL (per company) and user email only apply to records that aren't deleted. That needs a partial unique index `WHERE deleted_at IS NULL`, added with raw SQL in a migration, because Prisma's schema can't express it. Deleted accounts can't log in.
  - Deferred: an audit trail, and managing deleted records (viewing, restoring, deleting for good after a set time). The user would like the database to do that last part automatically.
- The proposed scope cuts have been reviewed. The ones the user commented on moved to Deferred in README, and the rest are now decided cuts in `SCOPE-CUTS.md`.
- Tests: mostly unit tests, but only meaningful ones, with no mock shuffling and no trivial assertions. A few integration tests that cover a lot. At most 5 end-to-end Playwright tests, for the main flows.

### Technical choices by the agent (not reviewed by the user)

- No separate position entity. The position is a field on the employee (ledger Q3), and a template is only a set of factors.
- More decisions from the planning interview are in `docs/GRILLING-LEDGER.md`, including the architecture, auth, PDF approach, demo seed and test stack. Where it disagrees with this file, the ledger is right.
- Seeds: the predefined risk factors and the first Telemedi user.
- Prisma: check the current docs (Context7) before setting it up, because the setup changed in recent major versions (config file, client output path, driver adapters). Keep one global client instance so dev hot reloads don't open extra connections.

### Open questions

These are also listed in `README.md` under Deferred.
- Can HR operators cancel a referral?
- Should we limit referrals per employee, for example to one open at a time?

Things the user decided not to build are in `docs/SCOPE-CUTS.md`.

### Project state

- OpenSpec is configured for Claude Code, Codex and OpenCode.
- `setup-tech-stack` is implemented on branch `setup-tech-stack` in `/tmp/fit-for-work-setup-tech-stack`; code is uncommitted and has not been integrated into the main checkout. No business modules are implemented.
- The seven-change OpenSpec sequence and working approach are recorded in `docs/notes.md`.
- Setup checks passed: locked install, lint/type checking, SQLite integration, Chromium smoke test, production build, container startup, migration failure and volume persistence. Container checks used Docker Compose through rootless Podman's API. Seven moderate transitive lint-tooling audit findings remain.
- Next: review/verify setup before archiving; accounts/company access follows setup. Scope cuts have been reviewed.

### Working with this user

- They dictate in English mixed with Polish, so expect misheard words.
- They never want `git add`, `git commit` or `git push` unless they ask. They want exact dependency versions and dates as `yyyy-MM-dd`.
