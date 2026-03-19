/**
 * Calendar E2E tests — CaptureOS
 *
 * These tests run against the live app (captureos.app by default, or BASE_URL).
 * /api/calendar is intercepted with mock data so tests are deterministic
 * and don't depend on Cal.com being reachable.
 *
 * Requires a saved auth session:
 *   npx playwright test --project=setup   (one-time, manual Google login)
 *   npm run test:e2e                       (subsequent runs)
 */

import { test, expect } from "@playwright/test";
import { CalendarPage } from "./pages/CalendarPage";
import { format, addMonths, subMonths } from "date-fns";

// ── Shared mock booking ────────────────────────────────────────────────────
const MARCH_22 = new Date("2026-03-22T17:00:00.000Z");

const MOCK_BOOKING = {
  id: 17261466,
  uid: "34Ax2KyKiQXVA88fzfLpzr",
  title: "RevenueCS Discovery Call",
  startTime: "2026-03-22T17:00:00.000Z",
  endTime: "2026-03-22T17:30:00.000Z",
  status: "ACCEPTED",
  attendees: [{ name: "Michael Cannavino", email: "michaelcvino@proton.me" }],
  location: null,
};

// Helper: intercept /api/calendar and return deterministic data
async function mockCalendarApi(
  page: import("@playwright/test").Page,
  bookings: typeof MOCK_BOOKING[] = []
) {
  await page.route("**/api/calendar**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: bookings }),
    });
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe("Calendar page", () => {
  test("loads and shows current month with day headers", async ({ page }) => {
    await mockCalendarApi(page, []);
    const cal = new CalendarPage(page);
    await cal.goto();

    // Subtitle shows the current month
    const now = new Date();
    await cal.assertCurrentMonth(now);

    // Day-of-week column headers
    await cal.assertDayHeadersVisible();

    await page.screenshot({ path: "artifacts/calendar-loaded.png" });
  });

  test("shows a booking chip on the correct day", async ({ page }) => {
    await mockCalendarApi(page, [MOCK_BOOKING]);

    // Navigate to March 2026 where the mock booking lives
    await page.goto("/calendar");
    const cal = new CalendarPage(page);

    // Navigate to March 2026 if we're not already there
    const now = new Date();
    const target = new Date(2026, 2); // March 2026
    const monthDiff =
      (target.getFullYear() - now.getFullYear()) * 12 +
      (target.getMonth() - now.getMonth());

    for (let i = 0; i < Math.abs(monthDiff); i++) {
      if (monthDiff > 0) await cal.nextMonthBtn.click();
      else await cal.prevMonthBtn.click();
      await page.waitForLoadState("networkidle");
    }

    await cal.assertCurrentMonth(target);

    // The booking chip should appear on March 22
    const chip = cal.bookingChip(MOCK_BOOKING.id);
    await expect(chip).toBeVisible();
    await expect(chip).toContainText("Michael Cannavino");

    await page.screenshot({ path: "artifacts/calendar-booking-chip.png" });
  });

  test("clicking a day with a booking shows details in the side panel", async ({
    page,
  }) => {
    await mockCalendarApi(page, [MOCK_BOOKING]);
    await page.goto("/calendar");
    const cal = new CalendarPage(page);

    // Navigate to March 2026
    const now = new Date();
    const target = new Date(2026, 2);
    const monthDiff =
      (target.getFullYear() - now.getFullYear()) * 12 +
      (target.getMonth() - now.getMonth());
    for (let i = 0; i < Math.abs(monthDiff); i++) {
      if (monthDiff > 0) await cal.nextMonthBtn.click();
      else await cal.prevMonthBtn.click();
      await page.waitForLoadState("networkidle");
    }

    // Click March 22
    await cal.dayCell(MARCH_22).click();

    // Detail panel heading updates
    await expect(cal.detailHeading).toContainText("Sun, Mar 22");

    // Booking card appears
    const detail = cal.bookingDetail(MOCK_BOOKING.id);
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("RevenueCS Discovery Call");
    await expect(detail).toContainText("ACCEPTED");
    await expect(detail).toContainText("Michael Cannavino");

    await page.screenshot({ path: "artifacts/calendar-day-detail.png" });
  });

  test("clicking a day with no bookings shows empty state", async ({ page }) => {
    await mockCalendarApi(page, []);
    const cal = new CalendarPage(page);
    await cal.goto();

    // Click any day in the current month
    const today = new Date();
    await cal.dayCell(today).click();

    await expect(cal.detailHeading).toContainText(format(today, "EEEE, MMM d"));
    await expect(cal.detailPanel).toContainText("No bookings");
  });

  test("prev/next month navigation changes the month header", async ({ page }) => {
    await mockCalendarApi(page, []);
    const cal = new CalendarPage(page);
    await cal.goto();

    const now = new Date();

    // Go forward one month
    await cal.nextMonthBtn.click();
    await page.waitForLoadState("networkidle");
    await cal.assertCurrentMonth(addMonths(now, 1));

    // Go back two months
    await cal.prevMonthBtn.click();
    await cal.prevMonthBtn.click();
    await page.waitForLoadState("networkidle");
    await cal.assertCurrentMonth(subMonths(now, 1));

    await page.screenshot({ path: "artifacts/calendar-navigation.png" });
  });

  test("Today button resets to current month", async ({ page }) => {
    await mockCalendarApi(page, []);
    const cal = new CalendarPage(page);
    await cal.goto();

    // Navigate away
    await cal.nextMonthBtn.click();
    await cal.nextMonthBtn.click();
    await page.waitForLoadState("networkidle");

    // Reset
    await cal.todayBtn.click();
    await page.waitForLoadState("networkidle");
    await cal.assertCurrentMonth(new Date());
  });

  test("shows error banner when API fails", async ({ page }) => {
    // Intercept with an error response
    await page.route("**/api/calendar**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "CALCOM_API_KEY not configured" }),
      });
    });

    const cal = new CalendarPage(page);
    await cal.goto();

    await expect(cal.errorBanner).toBeVisible();
    await expect(cal.errorBanner).toContainText("CALCOM_API_KEY");

    await page.screenshot({ path: "artifacts/calendar-error.png" });
  });
});
