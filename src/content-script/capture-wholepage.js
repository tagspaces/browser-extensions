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
import Readability from 'readability';

const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

function getCleanedHtml() {
  try {
    const loc = document.location;
    const uri = {
      spec: loc.href,
      host: loc.host,
      prePath: loc.protocol + "//" + loc.host,
      scheme: loc.protocol.substr(0, loc.protocol.indexOf(":")),
      pathBase: loc.protocol + "//" + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1)
    };
    const documentClone = document.cloneNode(true);
    const article = new Readability(uri, documentClone).parse();
    let extractedContent = '<h1>' + article.title + '</h1>' + article.content
    return extractedContent;
  } catch (error) {
    console.warn('Error parsing document, sending original content');
    return undefined;
  }
}

function getOriginalHtml() {
  let body = document.body.innerHTML;
  let head = document.head.innerHTML;
  return '<html><head>' + head + '</head><body>' + body + '</body></htlm>';
}

const contentMsg = {
  action: "htmlcontent",
  cleanedHTML: getCleanedHtml(),
  originalHTML: getOriginalHtml()
};
isFirefox ? browser.runtime.sendMessage(contentMsg) : chrome.runtime.sendMessage(contentMsg);
