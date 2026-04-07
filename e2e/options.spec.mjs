import { test, expect } from "./extension.fixture.mjs";

test.describe("Options page — structure", () => {
  test("renders the options form with the screenshot checkbox", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForSelector("form", { state: "visible" });

    await expect(page.locator("#form")).toBeVisible();
    await expect(
      page.locator('[name="enableScreenshotEmbedding"]'),
    ).toBeVisible();
  });
});

test.describe("Options page — structure (new settings)", () => {
  test("renders enableFrontMatter checkbox", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForSelector("form", { state: "visible" });
    await expect(
      page.locator('[name="enableFrontMatter"]'),
    ).toBeVisible();
  });

  test("renders enableAutoTagging checkbox", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForSelector("form", { state: "visible" });
    await expect(
      page.locator('[name="enableAutoTagging"]'),
    ).toBeVisible();
  });
});

test.describe("Options page — persistence", () => {
  test("toggling enableScreenshotEmbedding persists after reload", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForSelector("form", { state: "visible" });

    const checkbox = page.locator('[name="enableScreenshotEmbedding"]');
    const before = await checkbox.isChecked();

    await checkbox.click();
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector("form", { state: "visible" });

    const after = await page
      .locator('[name="enableScreenshotEmbedding"]')
      .isChecked();
    expect(after).toBe(!before);
  });

  test("toggling enableFrontMatter persists after reload", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForSelector("form", { state: "visible" });

    const checkbox = page.locator('[name="enableFrontMatter"]');
    const before = await checkbox.isChecked();
    await checkbox.click();
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector("form", { state: "visible" });
    const after = await page
      .locator('[name="enableFrontMatter"]')
      .isChecked();
    expect(after).toBe(!before);
  });

  test("toggling enableAutoTagging persists after reload", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForSelector("form", { state: "visible" });

    const checkbox = page.locator('[name="enableAutoTagging"]');
    const before = await checkbox.isChecked();
    await checkbox.click();
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector("form", { state: "visible" });
    const after = await page
      .locator('[name="enableAutoTagging"]')
      .isChecked();
    expect(after).toBe(!before);
  });
});
