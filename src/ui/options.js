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
  OptionsManager.save({
    enableScreenshotEmbedding: form.enableScreenshotEmbedding.checked,
    enableOpenLocationCode: form.enableOpenLocationCode.checked,
  });
}

// Restores select box and checkbox state using the preferences
// stored in browser.storage.
function load() {
  OptionsManager.load().then((items) => {
    form.enableScreenshotEmbedding.checked = items.enableScreenshotEmbedding;
    form.enableOpenLocationCode.checked = items.enableOpenLocationCode;
  });
}

document.addEventListener("DOMContentLoaded", load);
document.getElementById("form").addEventListener("change", save);
