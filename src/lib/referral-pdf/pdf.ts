import { chromium } from "playwright";

import { renderReferralHtml } from "./html";
import type { ReferralSnapshot } from "./snapshot";

/** Renders a referral snapshot as an A4 PDF of the official form with headless Chromium. */
export async function renderReferralPdf(snapshot: ReferralSnapshot): Promise<Buffer> {
  // shortcut: one browser launch per PDF (~0.5–1 s); share a browser if referral volume makes that noticeable.
  const browser = await chromium.launch();
  try {
    // The form needs no JS; disabling it keeps an escaping slip from running script in Playwright's unsandboxed Chromium.
    const page = await browser.newPage({ javaScriptEnabled: false });
    await page.setContent(renderReferralHtml(snapshot));
    return await page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true });
  } finally {
    await browser.close();
  }
}
