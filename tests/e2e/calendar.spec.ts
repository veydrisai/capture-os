/**
 * Calendar E2E tests — CaptureOS
 *
 * Tests the calendar page with REAL Cal.com data (no mocks).
 * Requires a valid auth session (tests/e2e/.auth/user.json).
 *
 *   npx playwright test --project=setup   (one-time manual Google login)
 *   npm run test:e2e                       (subsequent runs)
 */

import { test, expect } from "@playwright/test";
import { CalendarPage } from "./pages/CalendarPage";
import { format, addMonths, subMonths } from "date-fns";

test.describe("Calendar page", () => {
  test("loads and shows current month with day headers", async ({ page }) => {
    const cal = new CalendarPage(page);
    await cal.goto();

    await cal.assertCurrentMonth(new Date());
    await cal.assertDayHeadersVisible();

    await page.screenshot({ path: "artifacts/calendar-loaded.png" });
  });

  test("clicking today opens the detail panel", async ({ page }) => {
    const cal = new CalendarPage(page);
    await cal.goto();

    const today = new Date();
    await cal.dayCell(today).click();

    await expect(cal.detailPanel).toBeVisible();
    await expect(cal.detailHeading).toContainText(format(today, "MMM d"));
  });

  test("detail panel shows bookings or empty state for today", async ({ page }) => {
    const cal = new CalendarPage(page);
    await cal.goto();

    await cal.dayCell(new Date()).click();
    await expect(cal.detailPanel).toBeVisible();

    // Either "No bookings" text or at least one booking-detail card must be present
    const noBookings = cal.detailPanel.getByText(/no bookings/i);
    const bookingCards = cal.detailPanel.locator('[data-testid^="booking-detail-"]');
    const hasEmpty = await noBookings.isVisible().catch(() => false);
    const bookingCount = await bookingCards.count();

    expect(hasEmpty || bookingCount > 0).toBe(true);
  });

  test("prev/next month navigation changes the month header", async ({ page }) => {
    const cal = new CalendarPage(page);
    await cal.goto();

    const now = new Date();

    await cal.nextMonthBtn.click();
    await page.waitForLoadState("networkidle");
    await cal.assertCurrentMonth(addMonths(now, 1));

    await cal.prevMonthBtn.click();
    await cal.prevMonthBtn.click();
    await page.waitForLoadState("networkidle");
    await cal.assertCurrentMonth(subMonths(now, 1));

    await page.screenshot({ path: "artifacts/calendar-navigation.png" });
  });

  test("Today button resets to current month", async ({ page }) => {
    const cal = new CalendarPage(page);
    await cal.goto();

    await cal.nextMonthBtn.click();
    await cal.nextMonthBtn.click();
    await page.waitForLoadState("networkidle");

    await cal.todayBtn.click();
    await page.waitForLoadState("networkidle");
    await cal.assertCurrentMonth(new Date());
  });

  test("March 2026 — booking chips visible if bookings exist in Cal.com", async ({ page }) => {
    const cal = new CalendarPage(page);
    await cal.goto();

    // Navigate to March 2026 where discovery calls were booked
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

    const chips = page.locator('[data-testid^="booking-chip-"]');
    const count = await chips.count();

    // Log booking count — informational, not a hard failure (depends on live Cal.com data)
    console.log(`[calendar] March 2026 booking chips found: ${count}`);

    if (count > 0) {
      // If chips exist, clicking the first one's day should show detail
      const firstChip = chips.first();
      await expect(firstChip).toBeVisible();
      const chipTestId = await firstChip.getAttribute("data-testid");
      console.log(`[calendar] First chip: ${chipTestId}`);
    }

    await page.screenshot({ path: "artifacts/calendar-march-2026.png" });
  });

  test("clicking a day with a booking chip shows it in the detail panel", async ({ page }) => {
    const cal = new CalendarPage(page);
    await cal.goto();

    // Look for any visible booking chip in the current month
    const chips = page.locator('[data-testid^="booking-chip-"]');
    const count = await chips.count();

    if (count === 0) {
      // Navigate forward month by month (up to 6 months) to find a booking
      let found = false;
      for (let i = 0; i < 6 && !found; i++) {
        await cal.nextMonthBtn.click();
        await page.waitForLoadState("networkidle");
        found = (await chips.count()) > 0;
      }
      if (!found) {
        test.skip(); // No bookings found in any upcoming month — skip
        return;
      }
    }

    // Get the booking ID from the chip's test ID (e.g. "booking-chip-17261466")
    const firstChip = chips.first();
    const chipTestId = await firstChip.getAttribute("data-testid") ?? "";
    const bookingId = chipTestId.replace("booking-chip-", "");

    // The chip lives inside its day cell — click the chip itself to select the day
    await firstChip.click();

    await expect(cal.detailPanel).toBeVisible();

    const detailCard = page.locator(`[data-testid="booking-detail-${bookingId}"]`);
    await expect(detailCard).toBeVisible();

    await page.screenshot({ path: "artifacts/calendar-booking-detail.png" });
  });
});
