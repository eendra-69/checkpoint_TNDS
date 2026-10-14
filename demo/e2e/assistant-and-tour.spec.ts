import { test, expect, signIn, type Who } from "./helpers";
import { pageStepsFor } from "../src/lib/page-tours";
import type { Page } from "@playwright/test";

async function openTour(page: Page) {
  await page.getByRole("button", { name: "Tour", exact: true }).click();
  return page.getByRole("dialog").locator("#onboard-title");
}

test.describe("Floating assistant", () => {
  test("customers get no assistant and the API refuses them", async ({ page }) => {
    await signIn(page, "minh");
    await page.goto("/chat/cust_minh");
    await expect(page.getByRole("button", { name: /^AI/ })).toHaveCount(0);
    const res = await page.request.post("/api/assistant", { data: { message: "queue", pathname: "/", topic: "queue" } });
    expect(res.status()).toBe(403);
  });

  test("staff get page chips and answers in the UI language", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/admin/workflow");
    await page.getByRole("button", { name: /^AI/ }).click();
    await page.getByRole("button", { name: "Ai được xem CCCD?" }).click();
    await expect(page.getByText(/CCCD đầy đủ: khách hàng/)).toBeVisible();
  });
});

test.describe("Tour button explains the current page", () => {
  const STAFF: [Who, string][] = [
    ["admin", "/ops"],
    ["admin", "/agent"],
    ["admin", "/compliance"],
    ["admin", "/metrics"],
    ["admin", "/admin"],
    ["admin", "/admin/workflow"],
  ];
  const CUSTOMER = ["/", "/office", "/workshop", "/lounge", "/chat/cust_minh", "/vetc/cust_minh", "/call/cust_minh"];

  for (const [who, path] of STAFF) {
    test(`${path}`, async ({ page }) => {
      await signIn(page, who);
      await page.goto(path);
      await expect(await openTour(page)).toHaveText(pageStepsFor(path, "vi")[0].title);
    });
  }

  for (const path of CUSTOMER) {
    test(`${path} (customer)`, async ({ page }) => {
      await signIn(page, "minh");
      await page.goto(path);
      await expect(await openTour(page)).toHaveText(pageStepsFor(path, "vi")[0].title);
      const jrpg = page.getByRole("dialog").locator(".jrpg-window");
      await expect(jrpg).toHaveCount(path === "/office" ? 1 : 0);
    });
  }

  test("/ and /login (guest)", async ({ page }) => {
    for (const path of ["/", "/login"]) {
      await page.goto(path);
      await expect(await openTour(page)).toHaveText(pageStepsFor(path, "vi")[0].title);
      await page.getByRole("dialog").getByRole("button", { name: "Bỏ qua" }).click();
    }
  });
});

test.describe("First visit", () => {
  test("no overlay opens by itself; Tour explains the landing page", async ({ page }) => {
    await signIn(page, "tuan");
    await expect(page).toHaveURL(/\/chat\/cust_tuan$/);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveCount(0);
    await expect(await openTour(page)).toHaveText(pageStepsFor("/chat/cust_tuan", "vi")[0].title);
    const steps = pageStepsFor("/chat/cust_tuan", "vi").length;
    for (let i = 0; i < steps; i++) await dialog.getByRole("button").last().click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await expect(dialog).toHaveCount(0);
  });
});
