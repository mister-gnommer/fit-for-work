# Product decisions

These are product decisions made deliberately, with the reason for each. Implementation details and the full question-and-answer record are in `GRILLING-LEDGER.md`. What we won't build is in `SCOPE-CUTS.md`, and what comes later is under Deferred in `README.md`.

## Access and accounts

- **One shared app for all companies, not one instance per company.** Telemedi works across companies, and a few hundred instances would be expensive to run. Each company's data is kept separate by one scoping helper, and tests check it. Splitting a company out later is easy, because every row has a `companyId`.
- **Telemedi works one company at a time, through a switcher.** Each screen is built once and serves both HR and Telemedi.
- **Whoever creates an account sets its password**, and no email is sent. The app sends no emails at all.
- **Only Telemedi changes referral statuses and deletes referrals or companies.** Statuses are mocked until the Telemedi API integration.

## Risk factors and templates

- **Predefined risk factors can't be changed by anyone, Telemedi included.** They come from Annex 1 of the regulation and are the same for every company. Companies add their own factors as plain text.
- **The exposure level belongs to a template's factor, not to the factor itself.** The level depends on the workplace. Noise can measure 85 dB in a warehouse and 62 dB in an office, but the factor "Hałas" is the same in both. Predefined factors are shared and read-only anyway. If a company wants a fixed level, it can create its own factor such as "Hałas 85 dB".
- **Templates point to factors and don't copy them.** If a company renames one of its factors, its templates show the new name the next time they're used. Referrals that already exist don't change.

## Referrals

- **Referrals are frozen when they're created.** A snapshot of all the printed data is saved, and the PDF is always rendered from it. Editing employees, factors or templates later never changes an issued referral.
- **The PDF is a faithful copy of the official form, not a pixel copy.** The regulation sets the content and the order of the fields (§ 4 ust. 2–3, Annex 3a). It doesn't set the layout.
- **"Employed" vs. "taking up work" follows the exam type.** Pre-employment means "taking up work", periodic and follow-up mean "employed". It can be overridden on the referral.
- **The place and date of issue come from the company's town and the creation date.** There's nothing extra to fill in.
- **An employee can have more than one referral.** Whether to limit this is still an open question.
- **Referrals have no human-readable number.** This is still an open question.

## Data

- **PESEL is unique within a company, not across the whole database.** The same person can work for two client companies.
- **Everything is soft deleted.** Deleted records disappear from the UI but stay in the database. Viewing and restoring them is deferred.
- **A deleted user's email can't be reused.** Better Auth keeps a plain unique index on email, and reuse is rare.
