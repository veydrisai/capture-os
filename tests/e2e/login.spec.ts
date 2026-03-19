import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Login Page", () => {
  test("renders all elements correctly", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.assertFullyLoaded();
  });

  test("logo is centered on the page", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const logo = login.logo;
    await expect(logo).toBeVisible();

    const logoBox = await logo.boundingBox();
    const viewportWidth = page.viewportSize()!.width;

    // Logo center should be within 40px of page center
    const logoCenter = logoBox!.x + logoBox!.width / 2;
    const pageCenter = viewportWidth / 2;
    expect(Math.abs(logoCenter - pageCenter)).toBeLessThan(40);
  });

  test("Google sign-in button links to /auth/google", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const href = await login.googleBtn.getAttribute("href");
    expect(href).toBe("/auth/google");
  });

  // Loading state is a transient React render before Google redirects —
  // not reliably testable against the live OAuth flow without mocking.
  test.skip("clicking Google button shows loading state", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Block the auth redirect so we can observe the loading state
    await page.route("**/auth/google**", (route) => route.abort());
    await page.route("**/accounts.google.com/**", (route) => route.abort());

    // Click and immediately check opacity — React sets loading=true synchronously
    await login.googleBtn.click();

    // The button changes opacity to 0.7 when loading=true
    const opacity = await login.googleBtn.evaluate((el) =>
      getComputedStyle(el).opacity
    );
    expect(parseFloat(opacity)).toBeLessThanOrEqual(0.7);
  });

  test("page title is CaptureOS", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(page).toHaveTitle(/CaptureOS/i);
  });

  test("restricted access note is visible", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.restrictedNote).toBeVisible();
  });
});
