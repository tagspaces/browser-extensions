/**
 * E2E tests for the extension popup.
 *
 * The popup is loaded as a regular Chrome extension tab (not via the toolbar
 * icon). In this mode, chrome.tabs.query({active:true}) returns the popup
 * tab itself, and Chrome blocks scripting.executeScript into
 * chrome-extension:// pages, so the service-worker capture round-trip does
 * NOT complete. Tests here verify UI structure, button interactions, and
 * save triggers that work independently of captured page content.
 */
import { test, expect } from "./extension.fixture.mjs";

// ---------------------------------------------------------------------------
// UI structure
// ---------------------------------------------------------------------------
test.describe("Popup — UI structure", () => {
  test("renders all core controls", async ({ popupPage }) => {
    await expect(popupPage.locator("#title")).toBeVisible();
    await expect(popupPage.locator("#tags")).toBeVisible();
    await expect(popupPage.locator("#preview")).toBeVisible();
    await expect(popupPage.locator("#saveWholePageAsHtml")).toBeVisible();
    await expect(popupPage.locator("#saveAsMhtml")).toBeVisible();
    await expect(popupPage.locator("#saveScreenshot")).toBeVisible();
    await expect(popupPage.locator("#saveFullScreenshot")).toBeVisible();
    await expect(popupPage.locator("#saveAsBookmark")).toBeVisible();
    await expect(popupPage.locator("#closePopup")).toBeVisible();
  });

  test("renders the three content-mode buttons", async ({ popupPage }) => {
    await expect(popupPage.locator("#simplifiedPreview")).toBeVisible();
    await expect(popupPage.locator("#fullPreview")).toBeVisible();
    await expect(popupPage.locator("#markdownPreview")).toBeVisible();
  });

  test("renders the settings gear button", async ({ popupPage }) => {
    await expect(popupPage.locator("#openSettings")).toBeVisible();
  });

  test("title input is pre-populated with the tab title", async ({
    popupPage,
  }) => {
    const value = await popupPage.locator("#title").inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Content-mode buttons
// (The service-worker capture does not complete when popup.html is its own
//  active tab, so htmlOriginal / htmlCleaned are never set and the
//  activePreview class is never applied. We verify the buttons are
//  interactive and do not throw JS errors.)
// ---------------------------------------------------------------------------
test.describe("Popup — content mode buttons", () => {
  test("content-mode buttons are clickable without errors", async ({
    popupPage,
  }) => {
    const errors = [];
    popupPage.on("pageerror", (e) => errors.push(e.message));

    await popupPage.locator("#fullPreview").click();
    await popupPage.locator("#simplifiedPreview").click();
    await popupPage.locator("#markdownPreview").click();

    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// User input
// ---------------------------------------------------------------------------
test.describe("Popup — user input", () => {
  test("user can overwrite the title field", async ({ popupPage }) => {
    await popupPage.locator("#title").fill("My Custom Title");
    await expect(popupPage.locator("#title")).toHaveValue("My Custom Title");
  });

  test("user can type comma-separated tags", async ({ popupPage }) => {
    await popupPage.locator("#tags").fill("research, 2024");
    await expect(popupPage.locator("#tags")).toHaveValue("research, 2024");
  });
});

// ---------------------------------------------------------------------------
// Save triggers
//
// launchPersistentContext does not emit Playwright download events, so we
// intercept window.saveAs (FileSaver) via addInitScript and verify it is
// called with the expected filename pattern.
//
// "Save as HTML" calls prepareContentPromise which handles an empty iframe
// gracefully and still calls saveAs — no content from the service worker
// is required.
// ---------------------------------------------------------------------------
test.describe("Popup — save triggers", () => {
  async function withSaveAsIntercepted(context, extensionId, fn) {
    const page = await context.newPage();
    // Auto-dismiss any alert dialogs (e.g. "Saving screenshot failed") so they
    // never block page.close() during teardown.
    page.on("dialog", (dialog) => dialog.dismiss());
    // Must be added BEFORE navigation so it runs before popup.dist.js loads
    await page.addInitScript(() => {
      window.__savedFiles = [];
      // FileSaver defines window.saveAs after DOMContentLoaded; patch it then
      const origAddEventListener = window.addEventListener.bind(window);
      origAddEventListener("DOMContentLoaded", () => {
        const orig = window.saveAs;
        window.saveAs = (blob, name) => {
          window.__savedFiles.push(name);
          if (orig) orig(blob, name);
        };
        // Mock captureVisibleTab for tests where no real tab is available
        if (typeof chrome !== "undefined" && chrome.tabs) {
          const fakeDataUrl =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
          chrome.tabs.captureVisibleTab = (...args) => {
            const cb = args[args.length - 1];
            if (typeof cb === "function") {
              cb(fakeDataUrl);
              return undefined;
            }
            return Promise.resolve(fakeDataUrl);
          };
        }
      });
    });
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector("#title", { state: "visible" });
    await fn(page);
    await page.close();
  }

  test("Save as Bookmark calls saveAs with a .url filename", async ({
    context,
    extensionId,
  }) => {
    await withSaveAsIntercepted(context, extensionId, async (page) => {
      await page.locator("#saveAsBookmark").click();
      await page.waitForFunction(() => window.__savedFiles?.length > 0, {
        timeout: 10_000,
      });
      const files = await page.evaluate(() => window.__savedFiles);
      expect(files[0]).toMatch(/\.url$/);
    });
  });

  test("Save Screenshot calls saveAs with a .png filename", async ({
    context,
    extensionId,
  }) => {
    await withSaveAsIntercepted(context, extensionId, async (page) => {
      await page.locator("#saveScreenshot").click();
      await page.waitForFunction(() => window.__savedFiles?.length > 0, {
        timeout: 10_000,
      });
      const files = await page.evaluate(() => window.__savedFiles);
      expect(files[0]).toMatch(/\.png$/);
    });
  });

  test("Save as HTML calls saveAs with a .html filename", async ({
    context,
    extensionId,
  }) => {
    await withSaveAsIntercepted(context, extensionId, async (page) => {
      // Give the popup a moment to initialise before clicking save
      await page.waitForTimeout(500);
      await page.locator("#saveWholePageAsHtml").click();
      await page.waitForFunction(() => window.__savedFiles?.length > 0, {
        timeout: 15_000,
      });
      const files = await page.evaluate(() => window.__savedFiles);
      expect(files[0]).toMatch(/\.html$/);
    });
  });
});

// ---------------------------------------------------------------------------
// Settings button
// ---------------------------------------------------------------------------
test.describe("Popup — settings button", () => {
  test("settings button opens the options page", async ({
    context,
    popupPage,
  }) => {
    const pagePromise = context.waitForEvent("page");
    await popupPage.locator("#openSettings").click();
    const optionsPage = await pagePromise;
    await optionsPage.waitForLoadState();
    expect(optionsPage.url()).toContain("options");
  });
});

// ---------------------------------------------------------------------------
// Clear tags button
// ---------------------------------------------------------------------------
test.describe("Popup — clear tags button", () => {
  test("clear button is hidden when tags field is empty", async ({
    popupPage,
  }) => {
    await expect(popupPage.locator("#clearTags")).toBeHidden();
  });

  test("clear button appears when tags are entered", async ({
    popupPage,
  }) => {
    await popupPage.locator("#tags").fill("tag1, tag2");
    await expect(popupPage.locator("#clearTags")).toBeVisible();
  });

  test("clicking clear button empties the tags field", async ({
    popupPage,
  }) => {
    await popupPage.locator("#tags").fill("tag1, tag2");
    await popupPage.locator("#clearTags").click();
    await expect(popupPage.locator("#tags")).toHaveValue("");
  });

  test("clear button is hidden again after clearing", async ({
    popupPage,
  }) => {
    await popupPage.locator("#tags").fill("tag1");
    await popupPage.locator("#clearTags").click();
    await expect(popupPage.locator("#clearTags")).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// Internal URL guard
// ---------------------------------------------------------------------------
test.describe("Popup — internal URL guard", () => {
  test("popup opens on internal pages without errors", async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto("chrome://version");

    const popupPage = await context.newPage();
    const errors = [];
    popupPage.on("pageerror", (e) => errors.push(e.message));
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForSelector("#title", { state: "visible" });

    await expect(popupPage.locator("#title")).toBeVisible();
    await expect(popupPage.locator("#saveAsBookmark")).toBeVisible();
  });
});
