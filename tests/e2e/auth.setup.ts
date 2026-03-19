/**
 * Auth setup — runs once before the calendar test suite.
 *
 * Because auth is Google OAuth, Playwright can't automate it.
 * This script opens a real browser so you can complete login manually,
 * then saves the session cookies to tests/e2e/.auth/user.json for reuse.
 *
 * Run once:
 *   npx playwright test --project=setup
 *
 * Future `npm run test:e2e` runs will reuse the saved session automatically.
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate via Google OAuth", async ({ page }) => {
  // Skip if a valid auth file already exists
  if (fs.existsSync(AUTH_FILE)) {
    const saved = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
    const hasSession = saved?.cookies?.some(
      (c: { name: string }) => c.name === "__session"
    );
    if (hasSession) {
      console.log("✅ Auth state already saved — skipping login.");
      return;
    }
  }

  console.log(
    "\n⚠️  No saved session found.\n" +
      "   A browser will open. Complete Google OAuth login, then wait.\n" +
      "   The session will be saved automatically.\n"
  );

  await page.goto("/login");
  await expect(page.locator("h1")).toContainText("CaptureOS", { timeout: 10_000 });

  // Wait up to 3 minutes for the user to complete OAuth and land on /dashboard
  await page.waitForURL(/\/(dashboard|leads|deals|contacts|calendar)/, {
    timeout: 180_000,
  });

  await page.context().storageState({ path: AUTH_FILE });
  console.log("✅ Auth state saved to", AUTH_FILE);
});
