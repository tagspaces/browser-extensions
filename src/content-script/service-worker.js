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
  if (msg.type === "capture-selection") {
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
    const injectionResults = await browserAPI.scripting.executeScript({
      target: { tabId: msg.tabId },
      func: () => {
        // const htmlSelection = getSelection().toString();
        let htmlSelection = getSelection().toString();
        if (typeof window.getSelection != "undefined") {
          var sel = window.getSelection();
          if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
              container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            htmlSelection = container.innerHTML;
          }
        } else if (typeof document.selection != "undefined") {
          if (document.selection.type == "Text") {
            htmlSelection = document.selection.createRange().htmlText;
          }
        }
        return htmlSelection;
      },
    });
    if (injectionResults && injectionResults[0] && injectionResults[0].result) {
      const response = {
        action: "htmlselection",
        source: injectionResults[0].result,
      };
      // console.log(JSON.stringify(response));
      // sendResponse(response);
      await browserAPI.runtime.sendMessage(response);
    }
  }
  return true;
});

browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === browserAPI.runtime.OnInstalledReason.INSTALL) {
    browserAPI.runtime.setUninstallURL(
      "https://www.tagspaces.org/uninstallsurvey/"
    );
  }
});
