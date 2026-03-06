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

let DEFAULT_OPTIONS = {
  enableScreenshotEmbedding: true,
  enableOpenLocationCode: true,
  enableAutomaticScreenshotTagging: true,
};

let browserAPI = null;
if (typeof browser !== "undefined") {
  browserAPI = browser;
} else if (typeof chrome !== "undefined") {
  browserAPI = chrome;
}

export default {
  save: (params) => {
    return browserAPI.storage.sync.set(params);
  },

  load: () => {
    return browserAPI.storage.sync.get(DEFAULT_OPTIONS);
  },

  onChange: (callback) => {
    browserAPI.storage.onChanged.addListener(function (changes) {
      let callbackChanges = {};

      for (let key in DEFAULT_OPTIONS) {
        if (changes[key] !== undefined) {
          callbackChanges[key] = changes[key].newValue;
        }
      }

      callback(callbackChanges);
    });
  },
};
