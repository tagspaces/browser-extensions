/**
 * @copyright Copyright (c) 2016-present, TagSpaces UG (haftungsbeschraenkt).
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
"use strict";

const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

function getCompleteHtml() {
  let body = document.body.innerHTML;
  let head = document.body.innerHTML;
  return '<html><head>' + head + '</head><body>' + body + '</body>';
}

if (isFirefox) {
  browser.runtime.sendMessage({
    action: "htmlcontent",
    source: getCompleteHtml()
  });
} else {
  chrome.runtime.sendMessage({
    action: "htmlcontent",
    source: getCompleteHtml()
  });
}
