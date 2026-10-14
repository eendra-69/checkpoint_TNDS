import { test, expect, signIn, expectForbidden, type Who } from "./helpers";

const HOME: Record<Exclude<Who, "minh" | "lan" | "tuan">, string> = {
  campaign_manager: "/ops",
  telesales: "/agent",
  compliance: "/compliance",
  executive: "/metrics",
  admin: "/admin",
};

const ALLOWED: Record<keyof typeof HOME, string[]> = {
  campaign_manager: ["/ops", "/metrics"],
  telesales: ["/agent"],
  compliance: ["/compliance"],
  executive: ["/metrics"],
  admin: ["/ops", "/agent", "/compliance", "/metrics", "/admin", "/admin/workflow"],
};

const STAFF_PAGES = ["/ops", "/agent", "/compliance", "/metrics", "/admin", "/admin/workflow", "/office"];

for (const who of Object.keys(HOME) as (keyof typeof HOME)[]) {
  test(`${who}: lands on ${HOME[who]} and is blocked elsewhere`, async ({ page }) => {
    await signIn(page, who);
    await expect(page).toHaveURL(new RegExp(`${HOME[who]}$`));
    for (const path of STAFF_PAGES) {
      if (who === "admin" && path === "/office") {
        // Admin holds chat:use, so the proxy lets it through; the office page sends non-customers home.
        await page.goto(path);
        await expect(page).toHaveURL(/localhost:\d+\/$/);
      } else if (ALLOWED[who].includes(path)) {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
      } else {
        await expectForbidden(page, path);
      }
    }
  });
}

test("admin permission override is enforced; reset restores it", async ({ page }) => {
  await signIn(page, "admin");
  const toggle = page.locator('button[aria-label="telesales agent:view"]');
  await expect(toggle).toHaveText("✓");
  await toggle.click();
  await expect(toggle).toHaveText("");

  await signIn(page, "telesales");
  await expect(page).toHaveURL(/\/forbidden\?need=agent%3Aview$/);

  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page).toHaveURL(/\/agent$/);
});
