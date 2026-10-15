import { test, expect, signIn } from "./helpers";

// Regressions found in the post-merge audit: display-name validation, presence
// leave + nameplates, and the lazily loaded LLM stream parser.

test("LLM stream replies still render (mocked SSE, lazy-loaded parser)", async ({ page }) => {
  await signIn(page, "minh");
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" },
      body: [
        { type: "start" },
        { type: "text-start", id: "t1" },
        { type: "text-delta", id: "t1", delta: "Xin chào, " },
        { type: "text-delta", id: "t1", delta: "đây là stream CERT-ABCDEF1234" },
        { type: "text-end", id: "t1" },
        { type: "finish" },
      ]
        .map((c) => `data: ${JSON.stringify(c)}\n\n`)
        .join("") + "data: [DONE]\n\n",
    }),
  );
  await page.goto("/chat/cust_minh");
  await page.getByPlaceholder("Nhập tin nhắn…").fill("hello");
  await page.getByRole("button", { name: "Gửi" }).click();
  await expect(page.getByText("Xin chào, đây là stream CERT-ABCDEF1234")).toBeVisible({ timeout: 15_000 });
});

test("display name: invalid names are explained, not crashed on", async ({ page }) => {
  await page.goto("/login");
  const input = page.locator("#displayName");
  await input.fill("A");
  await page.getByRole("button", { name: /Vào Virtual Office/ }).click();
  await page.getByText("Tên cần ít nhất 2 ký tự").waitFor();
  await page.waitForTimeout(500);
  if (!page.url().includes("/login")) throw new Error("submitted an invalid name");
  await input.fill("Minh 😀");
  await page.getByRole("button", { name: /Vào Virtual Office/ }).click();
  await page.getByText(/Chỉ dùng chữ, số/).waitFor();
  await input.fill("Tester");
  await page.getByRole("button", { name: /Vào Virtual Office/ }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  // Sidebar editor: same rule, VI messages, then a valid rename.
  await page.goto("/");
  await page.getByRole("button", { name: /Tên trong không gian ảo/ }).first().click();
  const editor = page.locator("input[placeholder]").filter({ hasNot: page.locator("#displayName") }).last();
  await editor.fill("x");
  await page.getByRole("button", { name: "Lưu" }).click();
  await page.getByText("Tên cần ít nhất 2 ký tự").waitFor();
  await editor.fill("Tester Hai");
  await page.getByRole("button", { name: "Lưu" }).click();
  await page.getByText("Tester Hai").first().waitFor();
});

test("presence: a player who leaves disappears right away", async ({ browser }) => {
  test.setTimeout(120_000);
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  await signIn(a, "minh");
  await signIn(b, "telesales");
  await a.goto("/lounge", { waitUntil: "networkidle" });
  await b.goto("/lounge", { waitUntil: "networkidle" });
  const count = b.getByText(/^\d+ đang online$/).first();
  const t0 = Date.now();
  while (!/^[2-9]/.test((await count.innerText().catch(() => "")) || "")) {
    if (Date.now() - t0 > 20_000) throw new Error("never saw 2 online: " + (await count.innerText()));
    await b.waitForTimeout(500);
  }
  // B sees A by the right name (story name, not the persona id).
  const names = await b.evaluate(() => document.body.innerText);
  if (/\bcustomer\b/.test(names)) throw new Error("raw persona id shown");
  await a.goto("/");
  const t1 = Date.now();
  while (!/^1 /.test(await count.innerText())) {
    if (Date.now() - t1 > 8_000) throw new Error("A lingered: " + (await count.innerText()));
    await b.waitForTimeout(250);
  }
});

test("sign-in never redirects off-site, and a deep link keeps its query", async ({ page }) => {
  // Open redirect: a protocol-relative `next` must not leave the app.
  await page.goto("/login?next=//evil.example/x");
  await page.getByRole("button", { name: /Anh Minh/ }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  expect(new URL(page.url()).host).toBe(new URL(test.info().project.use.baseURL!).host);

  // Signed out, /office?station=cs → /login carries the whole target in `next`.
  await page.context().clearCookies();
  await page.goto("/office?station=cs");
  await expect(page).toHaveURL(/\/login\?next=%2Foffice%3Fstation%3Dcs$/);
  await page.getByRole("button", { name: /Anh Minh/ }).click();
  await expect(page).toHaveURL(/\/office\?station=cs$/);
});

test("APIs answer 401 / 403 instead of redirecting to a page", async ({ page }) => {
  const anon = await page.request.get("/api/presence?scene=office", { maxRedirects: 0 });
  expect(anon.status()).toBe(401);
  await signIn(page, "compliance");
  const forbidden = await page.request.post("/api/chat", { data: {}, maxRedirects: 0 });
  expect(forbidden.status()).toBe(403);
});
