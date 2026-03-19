import { type Page, type Locator, expect } from "@playwright/test";
import { format } from "date-fns";

export class CalendarPage {
  readonly page: Page;
  readonly monthSubtitle: Locator;
  readonly prevMonthBtn: Locator;
  readonly nextMonthBtn: Locator;
  readonly todayBtn: Locator;
  readonly errorBanner: Locator;
  readonly detailPanel: Locator;
  readonly detailHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.monthSubtitle = page.locator("text=/^[A-Z][a-z]+ \\d{4}$/");
    this.prevMonthBtn = page.getByTestId("prev-month");
    this.nextMonthBtn = page.getByTestId("next-month");
    this.todayBtn = page.getByTestId("today-btn");
    this.errorBanner = page.getByTestId("calendar-error");
    this.detailPanel = page.getByTestId("day-detail-panel");
    this.detailHeading = page.getByTestId("day-detail-heading");
  }

  async goto() {
    await this.page.goto("/calendar");
    await this.page.waitForLoadState("networkidle");
  }

  dayCell(date: Date): Locator {
    return this.page.getByTestId(`day-cell-${format(date, "yyyy-MM-dd")}`);
  }

  bookingChip(id: number): Locator {
    return this.page.getByTestId(`booking-chip-${id}`);
  }

  bookingDetail(id: number): Locator {
    return this.page.getByTestId(`booking-detail-${id}`);
  }

  async assertCurrentMonth(date: Date) {
    await expect(this.monthSubtitle).toContainText(format(date, "MMMM yyyy"));
  }

  async assertDayHeadersVisible() {
    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      await expect(this.page.getByText(day, { exact: true }).first()).toBeVisible();
    }
  }
}
