/**
 * @copyright Copyright (c) 2016-present, TagSpaces GmbH.
 * @license AGPL-3.0
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License, version 3,
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 *
 */

import OptionsManager from "../lib/options-manager.js";

let form = document.getElementById("form");

// Saves options to browser.storage.sync.
function save() {
  const params = {
    enableScreenshotEmbedding: form.enableScreenshotEmbedding?.checked,
  };
  if (form.enableOpenLocationCode) {
    params.enableOpenLocationCode = form.enableOpenLocationCode.checked;
  }
  if (form.enableFrontMatter) {
    params.enableFrontMatter = form.enableFrontMatter.checked;
  }
  if (form.enableAutoTagging) {
    params.enableAutoTagging = form.enableAutoTagging.checked;
  }
  if (form.enableImageDataUrl) {
    params.enableImageDataUrl = form.enableImageDataUrl.checked;
  }
  OptionsManager.save(params);
}

// Restores select box and checkbox state using the preferences
// stored in browser.storage.
function load() {
  OptionsManager.load().then((items) => {
    if (form.enableScreenshotEmbedding) {
      form.enableScreenshotEmbedding.checked = items.enableScreenshotEmbedding;
    }
    if (form.enableOpenLocationCode) {
      form.enableOpenLocationCode.checked = items.enableOpenLocationCode;
    }
    if (form.enableFrontMatter) {
      form.enableFrontMatter.checked = items.enableFrontMatter;
    }
    if (form.enableAutoTagging) {
      form.enableAutoTagging.checked = items.enableAutoTagging;
    }
    if (form.enableImageDataUrl) {
      form.enableImageDataUrl.checked = items.enableImageDataUrl;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  load();

  // I18n
  let browserAPI = null;
  if (typeof browser !== "undefined") {
    browserAPI = browser;
  } else if (typeof chrome !== "undefined") {
    browserAPI = chrome;
  }
  if (browserAPI) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const msg = browserAPI.i18n.getMessage(el.dataset.i18n);
      if (msg) el.textContent = msg;
    });
  }
});
document.getElementById("form").addEventListener("change", save);
