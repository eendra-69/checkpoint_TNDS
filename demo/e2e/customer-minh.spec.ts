import { test, expect, signIn, expectForbidden, PLATES } from "./helpers";
import type { Page } from "@playwright/test";

/** Small transparent PNG for the claims upload (the panel needs at least one photo). */
const PHOTO = {
  name: "car.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  ),
};

const playerPos = (page: Page) =>
  page.evaluate(() => (window as unknown as { __worldPlayer?: { x: number; z: number } }).__worldPlayer!);

/** Walk one axis at a time toward (x, z), reading the dev-only player position after each short step. */
async function walkTo(page: Page, x: number, z: number) {
  for (const axis of ["x", "z"] as const) {
    const target = axis === "x" ? x : z;
    for (let i = 0; i < 80; i++) {
      const delta = target - (await playerPos(page))[axis];
      if (Math.abs(delta) < 0.15) break;
      const key = axis === "x" ? (delta > 0 ? "ArrowRight" : "ArrowLeft") : delta > 0 ? "ArrowDown" : "ArrowUp";
      await page.keyboard.down(key);
      await page.waitForTimeout(Math.min(250, Math.max(30, (Math.abs(delta) / 3.2) * 1000 * 0.6)));
      await page.keyboard.up(key);
    }
  }
}

test.describe("Anh Minh (Virtual Office)", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "minh");
  });

  test("lands on the welcome screen with the customer sidebar and no staff assistant", async ({ page }) => {
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    for (const name of ["Trang chủ", "Virtual Office", "Quy trình gia hạn", "Quy trình bồi thường"]) {
      await expect(page.getByRole("link", { name, exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /^AI/ })).toHaveCount(0);
  });

  test("walks to the CS desk and talks with E", async ({ page }) => {
    await page.goto("/office");
    await expect(page.getByText(/WASD \/ phím mũi tên để đi/).first()).toBeVisible({ timeout: 20_000 });
    await page.waitForFunction(() => (window as unknown as { __worldPlayer?: unknown }).__worldPlayer);
    // world/map.ts: spawn (10.5, 11.5); CS NPC at (15, 2.5), radius 1.4. Its desk blocks
    // row 3 (x 14–16), so approach from above: up the free x≈13.5 lane, then right.
    await walkTo(page, 13.5, 11.5);
    await walkTo(page, 13.5, 1.6);
    await walkTo(page, 14.8, 1.6);
    await expect(page.getByText("Nói chuyện với CS", { exact: true }).first()).toBeVisible();
    await page.keyboard.press("e");
    await expect(page.getByText("Bàn CS Tasco")).toBeVisible();
  });

  test("Admin board shows the case and a readable Classic chat button", async ({ page }) => {
    await page.goto("/office?station=admin");
    await expect(page.getByText(`Nguyễn Văn Minh · ${PLATES.minh}`)).toBeVisible();
    const classic = page.getByRole("button", { name: "Mở Classic chat" });
    await expect(classic).toBeVisible();
    const [color, bg] = await classic.evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.color, s.backgroundColor];
    });
    expect(color).not.toBe(bg);
  });

  test("files a claim: submit → need info → resolved", async ({ page }) => {
    await page.goto("/office?station=claims");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="file"]').setInputFiles(PHOTO);
    await page.getByPlaceholder(/Va chạm nhẹ/).fill("Va chạm cản trước");
    await page.getByRole("button", { name: "Gửi hồ sơ bồi thường" }).click();
    const claims = page.locator("main").getByText(/^CLM-/).locator("xpath=ancestor::li[1]");
    await expect(claims).toContainText("Đang xem xét");
    await expect(claims).toContainText("AI phân loại (demo): nghi va chạm cản");
    // Each action button only shows for the status it acts on, so wait for it to go away
    // before the next click (otherwise two server actions race on the same claim).
    const needInfo = page.getByRole("button", { name: "Cần bổ sung" });
    await needInfo.click();
    await expect(needInfo).toHaveCount(0);
    await expect(claims.getByText("Cần bổ sung", { exact: true })).toBeVisible();
    const resolve = page.getByRole("button", { name: "Xử lý xong (demo)" });
    await resolve.click();
    await expect(resolve).toHaveCount(0);
    await expect(claims).toContainText("Đã xử lý");
  });

  test("VETC page and the sidebar processes", async ({ page }) => {
    await page.goto("/vetc/cust_minh");
    await expect(page.getByText("Số dư E-tag")).toBeVisible();
    // The customer sidebar opens the office straight at a station.
    await page.getByRole("link", { name: "Quy trình gia hạn", exact: true }).first().click();
    await expect(page).toHaveURL(/\/office\?station=cs$/);
    await expect(page.getByText("Bàn CS Tasco")).toBeVisible();
    await page.getByRole("link", { name: "Quy trình bồi thường", exact: true }).first().click();
    await expect(page).toHaveURL(/\/office\?station=claims$/);
    await expect(page.getByRole("button", { name: "Gửi hồ sơ bồi thường" })).toBeVisible();
  });

  test("cannot open staff pages", async ({ page }) => {
    await expectForbidden(page, "/admin");
  });
});
