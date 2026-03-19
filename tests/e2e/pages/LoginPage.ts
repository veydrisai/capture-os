import { type Page, type Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly card: Locator;
  readonly welcomeHeading: Locator;
  readonly googleBtn: Locator;
  readonly restrictedNote: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('img[alt="CaptureOS"]').first();
    this.title = page.locator("h1");
    this.subtitle = page.locator("p").filter({ hasText: "command center" });
    this.card = page.locator(".glass-strong");
    this.welcomeHeading = page.locator("h2");
    this.googleBtn = page.locator("a").filter({ hasText: /google/i });
    this.restrictedNote = page.locator("p").filter({ hasText: /restricted/i });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async assertFullyLoaded() {
    await expect(this.logo).toBeVisible();
    await expect(this.title).toContainText("CaptureOS");
    await expect(this.welcomeHeading).toContainText("Welcome back");
    await expect(this.googleBtn).toBeVisible();
  }
}
