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
/* globals chrome, browser */

let browserAPI = null;
if (typeof browser !== "undefined") {
  browserAPI = browser;
} else if (typeof chrome !== "undefined") {
  browserAPI = chrome;
}

browserAPI.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  // Get the current tab.
  // console.log(
  //   sender.tab
  //     ? "from a content script:" + sender.tab.url
  //     : "from the extension"
  // );
  // const tabs = await browserAPI.tabs.query({
  //   active: true,
  //   currentWindow: true,
  // });
  // const tabId = tabs[0].id;
  if (msg.type === "capture-page") {
    const injectionResults = await browserAPI.scripting.executeScript({
      target: { tabId: msg.tabId },
      func: () => {
        const body = document.body.innerHTML;
        const head = document.head.innerHTML;
        const documentHTML = `<html><head>${head}</head><body>${body}</body></htlm>`;

        let selectionHTML = getSelection().toString();
        if (typeof window.getSelection != "undefined") {
          var sel = window.getSelection();
          if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
              container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            selectionHTML = container.innerHTML;
          }
        } else if (typeof document.selection != "undefined") {
          if (document.selection.type == "Text") {
            selectionHTML = document.selection.createRange().htmlText;
          }
        }

        const loc = document.location;
        const uri = {
          spec: loc.href,
          host: loc.host,
          prePath: loc.protocol + "//" + loc.host,
          scheme: loc.protocol.substring(0, loc.protocol.indexOf(":")),
          pathBase:
            loc.protocol +
            "//" +
            loc.host +
            loc.pathname.substring(0, loc.pathname.lastIndexOf("/") + 1),
        };

        const response = {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight,
          documentBaseUri: uri, // document.baseURI,
          selectionHTML,
          documentHTML,
        };
        return response;
      },
    });

    if (injectionResults && injectionResults[0]?.result) {
      const {
        width,
        height,
        viewportHeight,
        documentHTML,
        selectionHTML,
        documentBaseUri,
      } = injectionResults[0].result;
      const response = {
        action: "htmlcontent",
        originalHTML: documentHTML,
        selectionHTML,
        width,
        height,
        viewportHeight,
        documentBaseUri,
      };
      await browserAPI.runtime.sendMessage(response);
    }
  }
  // return true; needed for async responses
});

browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === browserAPI.runtime.OnInstalledReason.INSTALL) {
    browserAPI.runtime.setUninstallURL(
      "https://www.tagspaces.org/uninstallsurvey/",
    );
  }
});
