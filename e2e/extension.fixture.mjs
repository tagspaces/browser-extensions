import { test as base, chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, "../build/chrome");

if (!fs.existsSync(EXTENSION_PATH)) {
  throw new Error(
    `Extension build not found at ${EXTENSION_PATH}.\nRun "yarn build-chrome" first.`,
  );
}

export const test = base.extend({
  // Persistent browser context with the extension loaded.
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        "--disable-infobars",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });
    await use(context);
    await context.close();
  },

  // Extension ID, derived from the service worker URL.
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }
    // URL format: chrome-extension://<id>/service-worker.dist.js
    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },

  // A pre-loaded popup page.
  // When opened as a regular tab, chrome.tabs.query({active:true}) returns
  // the popup tab itself — sufficient for UI structure and interaction tests.
  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector("#title", { state: "visible" });
    await use(page);
  },
});

export const expect = test.expect;
