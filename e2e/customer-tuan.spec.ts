import { test, expect, signIn, lastBubble, PLATES, CERT_RE } from "./helpers";

test.describe("Anh Tuấn (incomplete vehicle)", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "tuan");
  });

  test("lands in Classic chat with the needs-confirmation badge", async ({ page }) => {
    await expect(page).toHaveURL(/\/chat\/cust_tuan$/);
    await expect(page.getByText("Cần xác nhận", { exact: true })).toBeVisible();
    await expect(page.getByText(PLATES.tuan).first()).toBeVisible();
  });

  test("must confirm before paying; one certificate only", async ({ page }) => {
    const chip = (name: string) => page.getByRole("button", { name, exact: true });

    await chip("thanh toán").click();
    await expect(lastBubble(page)).toContainText("vui lòng xác nhận xe");
    await expect(page.locator('a[href^="/verify/"]')).toHaveCount(0);

    const input = page.getByPlaceholder("Nhập tin nhắn…");
    await input.fill("xin chào");
    await input.press("Enter");
    await expect(lastBubble(page)).toContainText("Xin chào Lê Hoàng Tuấn");
    await expect(page.getByText("Cần xác nhận", { exact: true })).toBeVisible();

    await chip("xác nhận").click();
    await expect(lastBubble(page)).toContainText("Mazda CX-5");
    await expect(page.getByText("Hồ sơ OK", { exact: true })).toBeVisible();

    await chip("thanh toán").click();
    await expect(lastBubble(page)).toContainText("Đã nhận thanh toán mô phỏng");
    const cert = (await lastBubble(page).innerText()).match(CERT_RE)![0];
    await expect(page.locator(`a[href="/verify/${cert}"]`)).toBeVisible();

    await chip("thanh toán").click();
    await expect(lastBubble(page)).toContainText("đã được gia hạn");
    await expect(lastBubble(page)).toContainText(cert);
  });

  test("has no call consent", async ({ page }) => {
    await page.goto("/call/cust_tuan");
    await expect(page.getByText("Chưa đồng ý nhận cuộc gọi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Bắt đầu gọi" })).toBeDisabled();
  });

  test("cannot open another customer's pages", async ({ page }) => {
    for (const [path, own] of [
      ["/vetc/cust_minh", "/vetc/cust_tuan"],
      ["/call/cust_lan", "/call/cust_tuan"],
      ["/chat/cust_minh", "/chat/cust_tuan"],
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${own}$`));
    }
  });
});
