import { test, expect, signIn, opsState, lastBubble, expectForbidden, PLATES, CERT_RE } from "./helpers";

/*
 * The 3-minute demo story end to end, in one demo session (VI):
 * campaign → Minh renews → Lan asks for a human → telesales → Lan renews → re-run
 * campaign → executive funnel → compliance audit.
 */
test("demo journey across all roles", async ({ page }) => {
  test.setTimeout(240_000);

  await test.step("Campaign manager runs the renewal campaign", async () => {
    await signIn(page, "campaign_manager");
    await expect(page).toHaveURL(/\/ops$/);
    await expect(page.locator("nav a")).toHaveText(["Trang chủ", "Ops", "Metrics"]);
    await page.getByRole("button", { name: "Chạy chiến dịch gia hạn" }).click();
    await expect(page.getByText(/Lần chạy gần nhất nhắm tới\s*36/)).toBeVisible();
    await expect(page.getByText(/chưa đồng ý sử dụng dữ liệu: 4/)).toBeVisible();
    await expect(opsState(page, PLATES.minh)).toHaveText("Đã nhắc");
    await expect(opsState(page, PLATES.lan)).toHaveText("Không phản hồi");
    await expectForbidden(page, "/agent");
  });

  let minhCert = "";
  await test.step("Anh Minh renews at the office CS desk", async () => {
    await signIn(page, "minh");
    await expect(page).toHaveURL(/\/office$/);
    await page.goto("/office?station=cs");
    await page.getByRole("button", { name: "gia hạn", exact: true }).click();
    await expect(lastBubble(page)).toContainText("Toyota Vios");
    const input = page.getByPlaceholder("Hỏi CS…");
    await input.fill("thanh toán");
    await input.press("Enter");
    await expect(lastBubble(page)).toContainText("437.000");
    minhCert = (await lastBubble(page).innerText()).match(CERT_RE)![0];
    await input.fill("thanh toán");
    await input.press("Enter");
    await expect(lastBubble(page)).toContainText("đã được gia hạn");
    await expect(lastBubble(page)).toContainText(minhCert);

    await page.goto(`/verify/${minhCert}`);
    await expect(page.getByText("Hợp lệ")).toBeVisible();
    await expect(page.getByText(PLATES.minh)).toBeVisible();
  });

  await test.step("Chị Lan asks for a human on the AI call", async () => {
    await signIn(page, "lan");
    await expect(page).toHaveURL(/\/call\/cust_lan$/);
    await page.getByRole("button", { name: "Bắt đầu gọi" }).click();
    await page.getByRole("button", { name: "Gặp nhân viên" }).click();
    await expect(page.getByText(/Em đã chuyển anh\/chị sang nhân viên telesales/)).toBeVisible();
  });

  await test.step("Telesales works the handover", async () => {
    await signIn(page, "telesales");
    await expect(page).toHaveURL(/\/agent$/);
    const main = page.locator("main");
    await expect(main).toContainText("Trần Thị Lan");
    await expect(main).toContainText("từ cuộc gọi AI");
    await expect(main).toContainText("Trần Thị Lan yêu cầu gặp nhân viên");
    await expect(page.getByRole("button", { name: "Đã gia hạn" })).toBeDisabled();

    await page.getByRole("button", { name: "Hiện" }).first().click();
    await expect(main).toContainText("0912987654");
    await page.getByRole("button", { name: "Gửi link gia hạn" }).click();
    await expect(main).toContainText("đã gửi link");
    await page.getByRole("button", { name: "Hẹn gọi lại" }).click();
    await expect(main).toContainText("Kết quả gần nhất: Hẹn gọi lại");
    await expect(main).toContainText("Trần Thị Lan");
  });

  await test.step("Chị Lan finishes through the renewal link", async () => {
    await signIn(page, "lan");
    await page.goto("/chat/cust_lan");
    await page.getByRole("button", { name: "xác nhận", exact: true }).click();
    await expect(lastBubble(page)).toContainText("Hyundai");
    await page.getByRole("button", { name: "Mở thanh toán giả" }).click();
    await page.getByRole("button", { name: "Mô phỏng thanh toán" }).click();
    await expect(page.locator('a[href^="/verify/CERT-"]')).toBeVisible();
  });

  await test.step("Telesales closes the case as renewed", async () => {
    await signIn(page, "telesales");
    const renewed = page.getByRole("button", { name: "Đã gia hạn" });
    await expect(renewed).toBeEnabled();
    await renewed.click();
    await expect(page.getByText(/Chưa có bàn giao/)).toBeVisible();
  });

  await test.step("Re-running the campaign skips renewed customers", async () => {
    await signIn(page, "campaign_manager");
    await page.getByRole("button", { name: "Chạy chiến dịch gia hạn" }).click();
    await expect(page.getByText(/đã gia hạn: 2/)).toBeVisible();
    await expect(opsState(page, PLATES.minh)).toHaveText("Đã cấp");
    await expect(opsState(page, PLATES.lan)).toHaveText("Đã cấp");
  });

  await test.step("Executive sees an exact funnel", async () => {
    await signIn(page, "executive");
    await expect(page).toHaveURL(/\/metrics$/);
    const funnel = page.locator("main");
    for (const [label, value] of [
      ["Đã nhắc", 36],
      ["Tương tác", 2],
      ["Xác nhận", 2],
      ["Thanh toán", 2],
      ["Đã cấp", 2],
      ["Bàn giao", 1],
    ] as const) {
      await expect(funnel.locator("div", { hasText: new RegExp(`^${label}$`) }).locator("xpath=following-sibling::div[1]")).toHaveText(String(value));
    }
    await expectForbidden(page, "/compliance");
  });

  await test.step("Compliance sees masked names and the audit trail", async () => {
    await signIn(page, "compliance");
    await expect(page).toHaveURL(/\/compliance$/);
    const main = page.locator("main");
    await expect(main.locator("tbody tr").first()).toContainText("Minh •••");
    for (const entry of ["Chạy chiến dịch", "Hiện dữ liệu cá nhân", "Gửi link gia hạn", "Ghi kết quả", "Cấp giấy chứng nhận"]) {
      await expect(main).toContainText(entry);
    }
    await expect(main).toContainText("Lý do: khách yêu cầu gọi lại");
    await expectForbidden(page, "/metrics");
  });
});
