import { test, expect } from "@playwright/test";

/**
 * Visual structure tests — verify all key sections render on every project.
 * Tagged @visual so they can be run separately: npm run test:visual
 */

test.describe("Visual structure @visual", () => {
  test("header is visible and sticky", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/fixed/);
  });

  test("hero section with title is visible", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
  });

  test("navigation links exist", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    const links = nav.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("footer is visible with copyright", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/EngAI/i);
  });

  test("no broken images or missing icons", async ({ page }) => {
    await page.goto("/");
    const imgs = page.locator("img");
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      const img = imgs.nth(i);
      if (await img.isVisible()) {
        const src = await img.getAttribute("src");
        expect(src).toBeTruthy();
      }
    }
  });

  test("mobile menu toggle works", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 375, height: 812 });
    const menuBtn = page.locator('button[aria-label="Menu"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    const mobileNav = page.locator("header >> .glass");
    await expect(mobileNav).toBeVisible();
  });

  test("FAQ accordion expands", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const faqSection = page.locator("#faq");
    await expect(faqSection).toBeVisible();
    const firstBtn = faqSection.locator("button").first();
    await firstBtn.click();
    const answer = faqSection.locator("div.animate-fade-in").first();
    await expect(answer).toBeVisible();
  });

  test("related tools section exists", async ({ page }) => {
    await page.goto("/");
    const tools = page.locator("#tools");
    await expect(tools).toBeVisible();
    const toolCards = tools.locator("a");
    const count = await toolCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
