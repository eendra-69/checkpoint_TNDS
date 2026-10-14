import { test, expect } from "./helpers";

test.describe("Guest (signed out)", () => {
  test("home shows the demo in Vietnamese with watermark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.getByText("DEMO — SYNTHETIC")).toBeVisible();
    await expect(page.getByRole("link", { name: "Vào demo" })).toBeVisible();
  });

  test("staff pages redirect to login", async ({ page }) => {
    await page.goto("/ops");
    await expect(page).toHaveURL(/\/login\?next=%2Fops$/);
  });

  test("login lists the three demo customers and the staff personas", async ({ page }) => {
    await page.goto("/login");
    for (const name of ["Anh Minh", "Chị Lan", "Anh Tuấn"]) {
      await expect(page.getByRole("button", { name: new RegExp(name) })).toBeVisible();
    }
    for (const role of ["Nhân viên telesales", "Quản lý chiến dịch", "Cán bộ compliance", "Lãnh đạo kinh doanh", "Admin"]) {
      await expect(page.getByRole("heading", { name: role, exact: true })).toBeVisible();
    }
  });

  test("assistant answers only the start guide", async ({ request }) => {
    const ask = async (data: object) => (await (await request.post("/api/assistant", { data })).json()).text as string;
    expect(await ask({ message: "Nên thử gì trước?", pathname: "/", topic: "start" })).toContain("Bắt đầu với Quản lý chiến dịch");
    expect(await ask({ message: "tóm tắt hàng chờ", pathname: "/login" })).toContain("đăng nhập");
  });
});
