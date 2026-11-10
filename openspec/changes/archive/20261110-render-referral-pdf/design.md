# Design

## Context

- The PDF approach was decided in `docs/GRILLING-LEDGER.md` (Q6, Q13): an HTML/CSS copy of the form, printed to PDF by headless Chromium through Playwright, faithful but not pixel-perfect.
- `docs/research/referral-template/referral.html` is a working prototype of that form, already checked against the act. `NOTES.md` next to it maps each field and lists the strike-throughs.
- Playwright 1.65.0 is installed only as `@playwright/test`, for e2e tests. The Docker image (`node:24.14.1-bookworm`, runs as `node`) has no browser.
- No Prisma models exist yet for companies, employees or factors. The snapshot field names follow `docs/DATA-MODEL.md`, so `create-referral` can copy rows into it.

## Goals / Non-Goals

**Goals:** a pure `snapshot → HTML` function that unit tests can cover, a thin `HTML → PDF` function, and a container that can run it.

**Non-Goals:** no route, UI, database access or runtime snapshot validation (all in `create-referral`), no browser pooling, and no Polish labels file (the form prints all of its option words itself).

## Decisions

### Module layout

`src/lib/referral-pdf/`:
- `snapshot.ts`: the `ReferralSnapshot` type and its enum unions.
- `html.ts`: `renderReferralHtml(snapshot): string`, with the prototype's CSS and markup inlined as a template string.
- `pdf.ts`: `renderReferralPdf(snapshot): Promise<Buffer>`. No `import "server-only"`: it throws under Vitest, and a client bundle would already fail on Playwright's Node imports.
- Tests: `html.test.ts` (unit) and `pdf.test.ts` (integration).

### Snapshot shape

```ts
type ReferralSnapshot = {
  examType: "PRE_EMPLOYMENT" | "PERIODIC" | "FOLLOW_UP";
  employmentStatus: "EMPLOYED" | "TAKING_UP_WORK";
  issuePlace: string;  // company city at creation
  issueDate: string;   // yyyy-MM-dd
  employer: { name; nip; street: string | null; buildingNumber; flatNumber: string | null; postalCode; city };
  employee: {
    firstName; lastName; sex: "FEMALE" | "MALE";
    pesel: string | null; idDocumentName: string | null; idDocumentNumber: string | null; birthDate: string | null;
    city; street: string | null; buildingNumber; flatNumber: string | null;
  };
  position: string;
  workDescription: string;
  factors: { category: "PHYSICAL" | "DUSTS" | "CHEMICAL" | "BIOLOGICAL" | "OTHER"; name: string; exposureLevel: string | null }[];
};
```

- Optional fields are `string | null`, matching what Prisma returns for nullable columns, so `create-referral` copies rows without converting them.
- Enum values are the `docs/DATA-MODEL.md` strings. Prisma enums will be the same string unions, so they fit.
- The snapshot stores structured addresses, not preformatted ones. The renderer formats them, so the format can be fixed later without changing saved snapshots.
- A flat factor list, grouped by category when rendered. The count is `factors.length` and isn't stored: it's always derivable from the frozen factors. This differs slightly from `docs/DATA-MODEL.md`, which lists the count in the snapshot.
- Alternative: a separate Zod schema checked at render time. Rejected: the renderer only reads snapshots our own code wrote. The write-time check belongs where the snapshot is built from user input, in `create-referral`.

### HTML generation: template string plus `escapeHtml`

- One template string, copied from the prototype with `data-field` values replaced by interpolations. Every interpolated value goes through a small `escapeHtml` (`& < > " '`).
- Strike-throughs come from one helper that takes the options and the chosen index and wraps the others in `<span class="strike">`. For employed vs. taking up work, the pair that doesn't apply is wrapped as a whole.
- Alternative: React `renderToStaticMarkup`. It escapes automatically, but Next.js restricts importing `react-dom/server` in App Router server code, and the route that uses this module will live there. A template string has no framework coupling.

### Formatting

- Employer block, one line each: name; `street building[/flat]`, or `city building[/flat]` without a street; `postalCode city`; `NIP <nip>`.
- Employee address: `city, street building[/flat]`, or `city building[/flat]`.
- No-PESEL identity: `idDocumentNumber, idDocumentName[, data urodzenia: birthDate]`, as in the prototype's comment.
- Dates are printed as stored (`yyyy-MM-dd`), per the project's date rule.
- "stanowiska/stanowisk": "/stanowisk" is always struck. A referral has one position field (ledger Q3).

### PDF: a fresh browser per render

- `chromium.launch()` → `page.setContent(html)` → `page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true })` → `browser.close()` in `finally`.
- Marked in code as `shortcut: one browser launch per PDF (~0.5–1 s), share a browser if referral volume makes that noticeable`. At a few hundred companies, PDFs are rare.
- The runtime dependency is `playwright` 1.65.0, the version `@playwright/test` already uses, so both share one browser install.

### Font

- CSS stack: `"Liberation Serif", "Tinos", "Times New Roman", serif`. Liberation Serif is metric-compatible with Times and covers Polish.
- Docker installs `fonts-liberation`. Locally, most Linux desktops already have it; README will mention it.
- Alternative: embed a font file with `@font-face`. That makes every machine identical, but it adds a binary to the repo and a load path to manage. Not needed for a faithful (not pixel-perfect) form.

### Docker

As root, before `USER node`:
- `apt-get install fonts-liberation`;
- `npx --yes playwright@1.65.0 install-deps chromium` for the system libraries.

As `node`, after `npm ci`:
- `npx playwright install --only-shell chromium`. The headless shell is enough for `page.pdf` and smaller than full Chromium.

Playwright's default launch passes `--no-sandbox`, so the non-root container user needs no extra flags.

## Risks / Trade-offs

- [`npm test` now needs a local Chromium] → README states it. The PDF test is the only one that does, and it fails with Playwright's own "run playwright install" message.
- [Image size grows by roughly 150–250 MB (shell plus libraries)] → accepted. The single-container runtime needs the browser.
- [Next.js bundling `playwright` in a route] → not in this change. `create-referral` must check `serverExternalPackages` in the installed Next docs when it adds the route.
- [Different fonts locally and in Docker change line breaks] → accepted for a faithful copy. Docker is the reference environment.
- [Asserting PDF structure in a test is brittle] → the integration test only checks the `%PDF-` header and the page count from the page tree. Everything else about content is checked on the HTML in unit tests.
