import { test, expect } from "@playwright/test";

// All protected routes should redirect unauthenticated users to /login
const protectedRoutes = [
  "/dashboard",
  "/contacts",
  "/leads",
  "/deals",
  "/clients",
  "/calendar",
  "/activity",
  "/playbook",
  "/settings",
];

test.describe("Auth Guard — unauthenticated redirects", () => {
  for (const route of protectedRoutes) {
    test(`${route} → redirects to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Public routes", () => {
  test("/ redirects (index page resolves without error)", async ({ page }) => {
    const response = await page.goto("/");
    // Should either show login page or redirect — not 500
    expect(response?.status()).not.toBe(500);
  });

  test("/login is accessible without auth", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("CaptureOS");
  });
});
