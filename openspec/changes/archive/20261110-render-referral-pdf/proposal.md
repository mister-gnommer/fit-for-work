# Proposal

## Why

Referral creation needs a PDF on the official form (Annex 3a, Dz.U. 2023 poz. 607). Rendering it is the riskiest technical part: headless Chromium in the container, a serif font with Polish characters, and a faithful layout. It needs no database, auth or company scoping, so it can be built now, in parallel with `accounts-and-company-access`, and `create-referral` only has to wire it in.

## What Changes

- A `ReferralSnapshot` TypeScript type: everything the form prints, frozen at creation (`docs/DATA-MODEL.md`, Referral snapshot). The total factor count is derived from the factors, not stored.
- A pure function that turns a snapshot into the form's HTML, based on `docs/research/referral-template/referral.html`:
  - strikes the unused options (exam type, Pana/Panią, gendered forms, employed vs. taking up work);
  - prints the PESEL, or the ID document and birth date when there is no PESEL;
  - groups factors under categories I–V, each with an optional exposure level, and prints their count;
  - escapes all user-entered text.
- A server-only function that renders that HTML to an A4 PDF with headless Chromium through Playwright.
- The Docker image gets the Chromium headless shell, its system libraries and Liberation Serif.
- Out of scope, handled by `create-referral`: building and saving the snapshot, validating it when written, the download route and any UI.

## Capabilities

### New Capabilities

- `referral-pdf`: rendering a referral snapshot as the official referral form, as HTML and as a PDF, locally and in the container.

### Modified Capabilities

None. The container requirement lives in `referral-pdf`, so this change doesn't touch `application-runtime`, which `accounts-and-company-access` is also modifying.

## Impact

- New code under `src/lib/referral-pdf/`, with unit tests and one PDF integration test.
- New runtime dependency: `playwright` 1.65.0 (same version as `@playwright/test`, so both share one browser download).
- `Dockerfile`: system libraries, `fonts-liberation` and the Chromium headless shell.
- `README.md`: `npm test` now needs Chromium installed, like `test:e2e`.
- `docs/notes.md`: the write-time snapshot check moves to `create-referral`.
