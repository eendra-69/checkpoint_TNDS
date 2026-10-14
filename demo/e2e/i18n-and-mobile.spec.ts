import { test, expect, signIn, setLocale, opsState, PLATES } from "./helpers";

test.describe("English", () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, "en");
  });

  test("login and generated text follow the EN toggle", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Incomplete vehicle data · confirm in chat")).toBeVisible();

    await signIn(page, "admin");
    await page.goto("/ops");
    await page.getByRole("button", { name: "Run renewal campaign" }).click();
    await expect(page.getByText(/no data-use consent: 4/)).toBeVisible();
    await expect(opsState(page, PLATES.minh)).toHaveText("Reminded");
    const minhRow = page.locator("main tbody tr", { hasText: PLATES.minh });
    await expect(minhRow).toContainText(/Expires in \d+ days — ideal reminder window/);
    await expect(minhRow).toContainText("Zalo ZNS renewal reminder");

    await page.goto("/compliance");
    await expect(page.locator("main")).toContainText("Campaign run");
    await expect(page.locator("main")).toContainText("Targeted 36, excluded 4");
  });

  test("workflow canvas chrome and node text", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/admin/workflow");
    for (const tab of ["Business process", "Workflow states", "Data schema"]) {
      await expect(page.getByRole("button", { name: tab })).toBeVisible();
    }
    await expect(page.locator(".react-flow__node").first()).toContainText("Scored");
  });
});

test.describe("Vietnamese generated text", () => {
  test("ops reasons, workflow and audit are Vietnamese", async ({ page }) => {
    await signIn(page, "admin");
    const minhRow = page.locator("main tbody tr", { hasText: PLATES.minh });
    await page.goto("/ops");
    await expect(minhRow).toContainText(/Hết hạn trong \d+ ngày — thời điểm nhắc lý tưởng/);
    await expect(minhRow).toContainText("Nhắc gia hạn qua Zalo ZNS");
    await page.goto("/admin/workflow");
    await expect(page.locator(".react-flow__node").first()).toContainText("Đã chấm điểm");
    await page.goto("/compliance");
    await expect(page.locator("main")).toContainText("Khởi tạo phiên");
  });
});

test.describe("Mobile 375 px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const path of ["/office?station=cs", "/office?station=admin", "/office?station=claims", "/chat/cust_minh", "/call/cust_minh", "/vetc/cust_minh"]) {
    test(`${path} has no horizontal scroll`, async ({ page }) => {
      await signIn(page, "minh");
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
