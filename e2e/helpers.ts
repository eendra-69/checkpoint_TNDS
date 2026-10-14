import { test as base, expect, type Page } from "@playwright/test";
import { dictionaries } from "../src/lib/i18n/dictionaries";
import type { PersonaId } from "../src/lib/types";

export { expect };

const vi = dictionaries.vi;

export type Who = "minh" | "lan" | "tuan" | Exclude<PersonaId, "customer">;

const CUSTOMER_LABEL = { minh: "Anh Minh", lan: "Chị Lan", tuan: "Anh Tuấn" } as const;

export const PLATES = { minh: "30A-12345", lan: "51F-67890", tuan: "43A-55441" } as const;

const TOUR_KEYS = [
  "guest",
  "customer",
  "staff:telesales",
  "staff:campaign_manager",
  "staff:compliance",
  "staff:executive",
  "staff:admin",
].map((k) => `tasco-onboard:${k}`);

/**
 * `test` with first-visit tours marked as seen (they would cover the page), and
 * `page.goto` waiting for network idle so client buttons are hydrated before clicks.
 * Opt back in to tours with `test.use({ showTours: true })`.
 */
export const test = base.extend<{ showTours: boolean }>({
  showTours: [false, { option: true }],
  page: async ({ page, showTours }, provide) => {
    if (!showTours) {
      await page.addInitScript((keys) => {
        for (const k of keys) localStorage.setItem(k, "1");
      }, TOUR_KEYS);
    }
    const goto = page.goto.bind(page);
    page.goto = (url, options) => goto(url, { waitUntil: "networkidle", ...options });
    await provide(page);
  },
});

/** Sign in from /login. Personas in one test share the demo session (same cookie). */
export async function signIn(page: Page, who: Who) {
  await page.goto("/login");
  const button =
    who in CUSTOMER_LABEL
      ? page.getByRole("button", { name: new RegExp(CUSTOMER_LABEL[who as keyof typeof CUSTOMER_LABEL]) })
      : page
          .locator("form")
          .filter({ has: page.getByRole("heading", { name: vi.personas[who as PersonaId].label, exact: true }) })
          .getByRole("button");
  await button.click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  await page.waitForLoadState("networkidle");
}

export async function setLocale(page: Page, locale: "vi" | "en") {
  const { baseURL } = test.info().project.use;
  await page.context().addCookies([{ name: "tasco-locale", value: locale, url: baseURL! }]);
}

/** Case-state cell of a customer's row on /ops, found by plate (names are masked). */
export function opsState(page: Page, plate: string) {
  return page.locator("main tbody tr", { hasText: plate }).locator("td").nth(6);
}

/** Last chat bubble (Classic chat, office CS panel). */
export function lastBubble(page: Page) {
  return page.locator("main .whitespace-pre-wrap").last();
}

export async function expectForbidden(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/forbidden\?need=/);
}

export const CERT_RE = /CERT-[A-Z0-9_-]{10}/;
