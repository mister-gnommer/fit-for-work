# Tasks

## 1. Snapshot and HTML

- [x] 1.1 Add `src/lib/referral-pdf/snapshot.ts` with the `ReferralSnapshot` type from design.md; verify with `npm run typecheck`.
- [x] 1.2 Add `renderReferralHtml` in `src/lib/referral-pdf/html.ts`, porting `docs/research/referral-template/referral.html` (CSS and markup) to a template string with `escapeHtml` and the strike helper; verify with `npm run typecheck`.
- [x] 1.3 Add `html.test.ts` covering the spec scenarios on the HTML: both strike-through combinations, PESEL vs. ID document with birth date, factor grouping with exposure and empty categories, the count (8 and 0), and markup escaping; verify with `npm test`.

## 2. PDF rendering

- [x] 2.1 Add `playwright` 1.65.0 as an exact runtime dependency; verify that `npm ci` leaves one `playwright-core` version in `package-lock.json`.
- [x] 2.2 Add `renderReferralPdf` in `src/lib/referral-pdf/pdf.ts` (server-only, one browser per call, closed in `finally`, with a `shortcut:` comment); verify through 2.3.
- [x] 2.3 Add `pdf.test.ts`: render a typical snapshot and a long one, then assert the `%PDF-` header and page counts of 2 and more than 2; verify with `npm test`.
- [x] 2.4 Render the sample snapshot with Polish characters to `tmp/referral-sample.pdf` and compare it by eye with `docs/research/womp-referral-form.pdf`. Check the wording, strikes, factor layout, the notes on page 2 and that no glyphs are missing.
- [x] 2.5 Update README: `npm test` needs `npm exec -- playwright install chromium` (plus Liberation Serif on the host). Verify the commands run as written.

## 3. Container

- [x] 3.1 Update `Dockerfile` to install `fonts-liberation`, the Chromium system libraries (as root) and the Chromium headless shell (as `node`, after `npm ci`); verify that `docker compose build` succeeds.
- [x] 3.2 In the running container, render a sample PDF with a one-off `tsx` script through `docker compose exec` and confirm a valid two-page PDF comes out. Update README's Docker note ("the PDF runtime is added with referral creation").

## 4. Final checks

- [x] 4.1 Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`; all pass.
- [x] 4.2 Update `docs/notes.md`: change 2b no longer includes the snapshot schema check, and `create-referral` validates the snapshot when it writes it.

## Workflow follow-up

- `create-referral` builds the snapshot from database rows, validates it on write, adds the download route (check `serverExternalPackages` in the installed Next docs) and the UI.
- Archive after review.
