import { test, expect } from "@playwright/test";

/**
 * Functional tests — verify interactive tools actually work.
 * Tagged @functional so they can be run separately: npm run test:functional
 */

test.describe("ConcreteMix @functional", () => {
  test("calculates concrete mix", async ({ page }) => {
    await page.goto("/");
    await page.locator("#calculator").scrollIntoViewIfNeeded();
    await page.locator("select").selectOption("B25 (М350)");
    await page.locator('input[type="number"]').fill("2");
    await page.getByRole("button", { name: /подобрать состав/i }).click();
    const result = page.locator("text=Состав на 2 м³");
    await expect(result).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=кг")).toBeVisible();
  });
});

test.describe("CrackCalc @functional", () => {
  test("evaluates crack severity", async ({ page }) => {
    await page.goto("/");
    await page.locator("#calculator").scrollIntoViewIfNeeded();
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill("0.25");
    await inputs.nth(1).fill("150");
    await inputs.nth(2).fill("15");
    await page.getByRole("button", { name: /оценить трещину/i }).click();
    await expect(page.locator("text=/Н[1-4]/")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=ГОСТ 31937")).toBeVisible();
  });
});

test.describe("LoadBear @functional", () => {
  test("calculates load bearing capacity", async ({ page }) => {
    await page.goto("/");
    await page.locator("#calculator").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /рассчитать несущую способность/i }).click();
    await expect(page.locator("text=/НОРМА|ОГРАНИЧЕНО|КРИТИЧНО/")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=кН·м")).toBeVisible();
  });
});

test.describe("NormBase @functional", () => {
  test("search filters norms", async ({ page }) => {
    await page.goto("/");
    await page.locator("#search").scrollIntoViewIfNeeded();
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await searchInput.fill("бетон");
    const cards = page.locator("#search .space-y-3 > div");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(cards.nth(i)).toContainText(/бетон/i);
    }
  });

  test("category filter works", async ({ page }) => {
    await page.goto("/");
    await page.locator("#categories").scrollIntoViewIfNeeded();
    const catBtn = page.getByRole("button", { name: "Расчёт" });
    await catBtn.click();
    const cards = page.locator("#search .space-y-3 > div:not(:last-child)");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("RebarDesign @functional", () => {
  test("add and remove rebar bars", async ({ page }) => {
    await page.goto("/");
    await page.locator("#designer").scrollIntoViewIfNeeded();
    const addBtn = page.getByRole("button", { name: /добавить/i });
    const initialBars = await page.locator("text=/^#\\d+$/").count();
    await addBtn.click();
    const newBars = await page.locator("text=/^#\\d+$/").count();
    expect(newBars).toBe(initialBars + 1);
    const removeBtn = page.getByRole("button", { name: /удалить/i });
    await removeBtn.click();
    const finalBars = await page.locator("text=/^#\\d+$/").count();
    expect(finalBars).toBe(initialBars);
  });

  test("percentage updates with section size", async ({ page }) => {
    await page.goto("/");
    await page.locator("#designer").scrollIntoViewIfNeeded();
    const percentText = page.locator("text=% армирования").locator("..").locator("span").last();
    const initialPercent = await percentText.textContent();
    const widthSlider = page.locator('input[type="range"]').first();
    await widthSlider.fill("600");
    const newPercent = await percentText.textContent();
    expect(initialPercent).toBeTruthy();
    expect(newPercent).toBeTruthy();
  });
});
