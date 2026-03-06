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
/* globals saveAs, DOMPurify, OpenLocationCode */
import OptionsManager from "../lib/options-manager.js";
import {
  formatDateTime,
  getBase64ImagePromise,
  dataURItoBlobAsync,
  extractLatLong,
  getHighestResUrl,
} from "../lib/utils.js";
import { Readability, isProbablyReaderable } from "@mozilla/readability";
import DOMPurify from "dompurify";
import TurndownService from "turndown";

let browserAPI = null;
if (typeof browser !== "undefined") {
  browserAPI = browser;
  // Permission needed in Firefox for captureVisibleTabs
  browser.permissions.request({ origins: ["<all_urls>"] });
} else if (typeof chrome !== "undefined") {
  browserAPI = chrome;
}

let userSettings = {};
OptionsManager.load().then((options) => (userSettings = options));

document.addEventListener("DOMContentLoaded", init);

console.log("Loading popup...");

const isWin = navigator.userAgent.includes("Win");
const dirSeparator = isWin ? "\\" : "/";
const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
const isChrome = navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
const isEdge = navigator.userAgent.toLowerCase().indexOf("edg") > -1;
const supportedExts = [
  "png",
  "jpg",
  "jpeg",
  "svg",
  "webp",
  "gif",
  "bmp",
  "ico",
  "pdf",
  "ogg",
  "ogv",
  "mp4",
  "mp3",
];
const currentTabURLParser = document.createElement("a");
currentTabURLParser.setAttribute("id", "currentTabURLParser");
const cssInject =
  "img, figure, video { max-width: 100%; height: auto; } html { overflow-x: hidden; }";

let fileExt;
let currentTabURL;
let currentTabID;
let htmlOriginal;
let htmlCleaned;
let htmlSelection;
let documentBaseUri;
let contentMode = "simplified"; // 'original', 'markdown'
const activeTabQuery = browserAPI.tabs.query({
  currentWindow: true,
  active: true,
});

async function init() {
  const downloadFileEl = document.getElementById("downloadFile");
  const titleEl = document.getElementById("title");

  await activeTabQuery.then(
    (tabs) => {
      for (let tab of tabs) {
        currentTabURL = tab.url;
        currentTabID = tab.id;
        currentTabURLParser.href = currentTabURL;
        extractLatLong(currentTabURL, userSettings.enableOpenLocationCode);
        fileExt = extractFileExtFromUrl(currentTabURL);
        let title = tab.title.trim();
        title = title.replace(/[/\\?%*:|"<>]/g, "-");
        titleEl.value = title;
        titleEl.focus();
        supportedExts.indexOf(fileExt) >= 0
          ? (downloadFileEl.style.display = "")
          : (downloadFileEl.style.display = "none");
      }
    },
    (err) => {
      console.warn("Error getting active tab: " + err);
    },
  );

  titleEl.focus();
  document
    .getElementById("saveAsMhtml")
    .addEventListener("click", isFirefox ? savePDF : saveAsMHTML);
  document
    .getElementById("closePopup")
    .addEventListener("click", () => window.close());
  document
    .getElementById("saveAsBookmark")
    .addEventListener("click", saveAsBookmark);
  document
    .getElementById("saveWholePageAsHtml")
    .addEventListener("click", savePageContent);
  document
    .getElementById("saveScreenshot")
    .addEventListener("click", saveScreenshot);
  document
    .getElementById("saveFullScreenshot")
    .addEventListener("click", saveFullScreenshot);
  document
    .getElementById("downloadFile")
    .addEventListener("click", downloadFile);
  document
    .getElementById("simplifiedPreview")
    .addEventListener("click", simplifiedPreview);
  document
    .getElementById("markdownPreview")
    .addEventListener("click", markdownPreview);
  document.getElementById("fullPreview").addEventListener("click", fullPreview);

  // I18n this panel
  document.querySelectorAll("[data-i18n]").forEach((item) => {
    item.innerText = browserAPI.i18n.getMessage(item.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((item) => {
    item.setAttribute(
      "title",
      browserAPI.i18n.getMessage(item.dataset.i18nTitle),
    );
  });

  browserAPI.runtime.onMessage.addListener(handleHTML);

  browserAPI.runtime.sendMessage({
    type: "capture-page",
    tabId: currentTabID,
  });

  function handleHTML(msg, sender, sendResponse) {
    // host: "www.tagspaces.com"
    // pathBase: "https://www.tagspaces.com/articles/"
    // prePath: "https://www.tagspaces.com"
    // scheme: "https"
    // spec: "https://www.tagspaces.com/articles/testarticle
    const previewEl = document.getElementById("preview");
    documentBaseUri = msg.documentBaseUri;
    // console.log(msg);
    if (msg.originalHTML && !msg.selectionHTML) {
      htmlOriginal = DOMPurify.sanitize(msg.originalHTML);
      updatePreviewArea(htmlOriginal);
      fullPreview();
      contentMode = "original";
      const iframeClone = previewEl.contentDocument.cloneNode(true);
      if (isProbablyReaderable(iframeClone)) {
        const article = new Readability(iframeClone).parse();
        // console.log(article);
        // byline: "Core Team Member"
        // content: "<div id=\"readability-page-1\" class=\"page\"><di
        // dir: null
        // excerpt: "Your Own Decentralized ..."
        // lang: null
        // length: 10521
        // publishedTime: null
        // siteName: null
        // textContent: "Your Own Decentralized
        // title: "TagSpaces as a platform for file-based apps"
        htmlCleaned = article.content;
        if (article.title) {
          titleEl.value = article.title;
        }
        htmlCleaned = "<h1>" + titleEl.value + "</h1>\n" + htmlCleaned;
        updatePreviewArea(htmlCleaned);
        simplifiedPreview();
        contentMode = "simplified";
      }
    } else if (msg.selectionHTML) {
      htmlSelection = DOMPurify.sanitize(msg.selectionHTML);
      simplifiedPreview();
      updatePreviewArea(htmlSelection);
    } else {
      updatePreviewArea("No content was extracted...");
      noPreview();
    }
    return true;
  }
}

function saveAsFile(blob, filename) {
  // if (isFirefox) {
  saveAs(blob, filename);
  // } else {
  //   browser.downloads.download({
  //     url: URL.createObjectURL(blob),
  //     filename: filename,
  //     saveAs: true,
  //   });
  // }
}

function noPreview() {
  document
    .querySelector("#simplifiedPreview")
    .classList.remove("activePreview");
  document.querySelector("#fullPreview").classList.remove("activePreview");
  document.querySelector("#markdownPreview").classList.remove("activePreview");
}

function markdownPreview() {
  let htmlContent = "";
  simplifiedPreview();
  if (contentMode === "simplified") {
    htmlContent = htmlCleaned;
  } else if (contentMode === "original") {
    htmlOriginal = htmlOriginal;
  }
  contentMode = "markdown";
  document
    .querySelector("#simplifiedPreview")
    .classList.remove("activePreview");
  document.querySelector("#fullPreview").classList.remove("activePreview");
  document.querySelector("#markdownPreview").classList.add("activePreview");
  let turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    fence: "```",
  });
  let markdown = turndownService.turndown(htmlContent);
  if (!markdown) {
    markdown = "Markdown conversion failed";
  }
  updatePreviewArea(
    `<pre id="mdcontent" style="white-space: pre-wrap; font-size: 12px;">${markdown}</pre>`,
  );
}

function simplifiedPreview() {
  if (htmlCleaned) {
    contentMode = "simplified";
    document.querySelector("#simplifiedPreview").classList.add("activePreview");
    document.querySelector("#fullPreview").classList.remove("activePreview");
    document
      .querySelector("#markdownPreview")
      .classList.remove("activePreview");
    updatePreviewArea(htmlCleaned);
  }
}

function fullPreview() {
  if (htmlOriginal) {
    contentMode = "original";
    document
      .querySelector("#simplifiedPreview")
      .classList.remove("activePreview");
    document.querySelector("#fullPreview").classList.add("activePreview");
    document
      .querySelector("#markdownPreview")
      .classList.remove("activePreview");
    updatePreviewArea(htmlOriginal);
  }
}

function saveAsMHTML() {
  const saveAsMhtmlSpinner = document.querySelector("#saveAsMhtmlSpinner");
  saveAsMhtmlSpinner.classList.remove("d-none");
  browserAPI.pageCapture.saveAsMHTML(
    {
      tabId: currentTabID,
    },
    (mhtml) => {
      saveAsFile(mhtml, generateFileName(fileExt, "mht"));
      saveAsMhtmlSpinner.classList.add("d-none");
    },
  );
}

function downloadFile() {
  browserAPI.downloads.download({
    url: currentTabURL,
    filename: generateFileName(fileExt),
    saveAs: true,
  });
}

async function savePageContent() {
  const saveAsHTMLSpinner = document.querySelector("#saveAsHTMLSpinner");
  saveAsHTMLSpinner.classList.remove("d-none");
  if (contentMode === "markdown") {
    const mdContent = document
      .getElementById("preview")
      ?.contentDocument?.getElementById("mdcontent")?.innerText;
    try {
      const targetContent = await prepareMarkdownContentPromise(mdContent);
      const targetBlob = new Blob([targetContent], {
        type: "text/html;charset=utf-8",
      });
      saveAsFile(targetBlob, generateFileName("md"));
    } catch (err) {
      console.warn("Error handling html content", err);
      alert("Error by preparing the MD content...");
      location.reload();
    } finally {
      saveAsHTMLSpinner.classList.add("d-none");
    }
  } else {
    const htmlContent =
      document.getElementById("preview")?.contentDocument?.documentElement
        ?.innerHTML;
    try {
      const targetContent = await prepareContentPromise(htmlContent);
      const targetBlob = new Blob([targetContent], {
        type: "text/html;charset=utf-8",
      });
      saveAsFile(targetBlob, generateFileName("html"));
    } catch (err) {
      console.warn("Error handling html content", err);
      alert("Error by preparing the HTML content...");
      location.reload();
    } finally {
      saveAsHTMLSpinner.classList.add("d-none");
    }
  }
}

function saveScreenshot() {
  const saveScreenshotSpinner = document.querySelector(
    "#saveScreenshotSpinner",
  );
  saveScreenshotSpinner.classList.remove("d-none");
  const fileName = generateFileName("png", "screenshot");
  const captureFull = true; // !isFirefox
  browserAPI.tabs
    .captureVisibleTab(undefined, {
      format: "png",
    })
    .then(
      (imageUrl) => {
        dataURItoBlobAsync(imageUrl).then((blob) => {
          saveAsFile(blob, fileName);
        });
        saveScreenshotSpinner.classList.add("d-none");
      },
      (err) => {
        saveScreenshotSpinner.classList.add("d-none");
        console.warn("Error taking screenshot " + JSON.stringify(err));
        alert("Saving screenshot failed");
      },
    );
}

function saveFullScreenshot() {
  const saveFullScreenshotSpinner = document.querySelector(
    "#saveFullScreenshotSpinner",
  );
  saveFullScreenshotSpinner.classList.remove("d-none");
  const fileName = generateFileName("png", "screenshot");
  captureFullPage(currentTabID).then(
    (blob) => {
      const url = URL.createObjectURL(blob);
      saveFullScreenshotSpinner.classList.add("d-none");
      if (isFirefox) {
        dataURItoBlobAsync(url).then((blob) => {
          saveAsFile(blob, fileName);
        });
      } else {
        browserAPI.downloads.download({
          url,
          filename: fileName,
          saveAs: true,
        });
      }
    },
    (err) => {
      saveFullScreenshotSpinner.classList.add("d-none");
      console.warn("Error taking screenshot " + JSON.stringify(err));
      alert("Saving screenshot failed");
    },
  );
}

/* Firefox only */
async function savePDF() {
  if (!isFirefox) return;
  const saveAsMhtmlSpinner = document.querySelector("#saveAsMhtmlSpinner");
  saveAsMhtmlSpinner.classList.remove("d-none");
  const fileName = generateFileName("pdf");

  // 2. Inject script to change the title (and store the original)
  const [{ result: originalTitle }] = await browserAPI.scripting.executeScript({
    target: { tabId: currentTabID },
    func: (newTitle) => {
      const old = document.title;
      document.title = newTitle;
      return old; // Return to extension so we can restore it later
    },
    args: [fileName],
  });

  try {
    // 3. Trigger the Firefox PDF dialog
    // It will now see the new document.title as the filename
    await browserAPI.tabs.saveAsPDF({});
  } catch (err) {
    console.error("Firefox saveAsPDF failed:", err);
    alert("Saving PDF failed");
  } finally {
    // 4. Always restore the original title so the user doesn't see ".pdf" in their tab
    await browserAPI.scripting.executeScript({
      target: { tabId: currentTabID },
      func: (oldTitle) => {
        document.title = oldTitle;
      },
      args: [originalTitle],
    });
  }
}

function saveAsBookmark() {
  const saveBookmarkSpinner = document.querySelector("#saveBookmarkSpinner");
  saveBookmarkSpinner.classList.remove("d-none");
  const capturing = browserAPI.tabs.captureVisibleTab(null, {
    format: "jpeg",
    quality: 95,
  });
  capturing.then((imageDataUrl) => {
    // Make capturing optional, evtl. resize the image
    const screenshot = userSettings.enableScreenshotEmbedding
      ? "COMMENT=" + imageDataUrl + "\r\n"
      : "";
    const content =
      "[InternetShortcut]\r\nURL=" + currentTabURL + "\r\n" + screenshot;
    const textBlob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    saveAsFile(textBlob, generateFileName("url"));
    saveBookmarkSpinner.classList.add("d-none");
  });
}

function updatePreviewArea(htmlContent) {
  const previewEl = document.getElementById("preview");
  const previewHtmlEl = previewEl.contentDocument.documentElement;
  previewHtmlEl.innerHTML = htmlContent;
  const allSource = previewHtmlEl.getElementsByTagName("source");
  for (const source of allSource) {
    source.setAttribute("srcset", "");
  }

  // Fix relative urls in links
  const allLinks = previewHtmlEl.getElementsByTagName("a");
  for (const link of allLinks) {
    const linkHref = link.getAttribute("href");
    if (!linkHref) {
      continue;
    }
    if (linkHref.startsWith("/")) {
      const newLinkUrl = documentBaseUri.prePath + linkHref;
      // console.log(newImageUrl);
      link.setAttribute("href", newLinkUrl);
    }
  }

  // Fix svg icons shown in full width
  const allSVGs = previewHtmlEl.getElementsByTagName("svg");
  for (const svg of allSVGs) {
    if (!svg.style.maxWidth) {
      svg.style.maxWidth = "100px";
    }
  }

  const allImages = previewHtmlEl.getElementsByTagName("img");

  const pathBaseURL = new URL(documentBaseUri.pathBase);
  const cleanedPath = pathBaseURL.origin + pathBaseURL.pathname;

  for (const img of allImages) {
    // img.style.maxWidth = "100%";
    const imgSrc = img.getAttribute("src");
    // console.log(imgSrc);
    // img.setAttribute("width", img.getAttribute("naturalWidth"));
    if (!imgSrc) {
      continue;
    }

    if (
      imgSrc.startsWith("file:") ||
      imgSrc.startsWith("http") ||
      imgSrc.startsWith("data:image") ||
      imgSrc.startsWith("ts:")
    ) {
      // do nothing
    } else if (imgSrc.startsWith("//")) {
      const newImageUrl = documentBaseUri.scheme + ":" + imgSrc;
      // console.log(newImageUrl);
      img.setAttribute("src", newImageUrl);
    } else if (imgSrc.startsWith("/")) {
      const newImageUrl = documentBaseUri.prePath + imgSrc;
      // console.log(newImageUrl);
      img.setAttribute("src", newImageUrl);
    } else if (imgSrc.startsWith("./")) {
      const newImageUrl = cleanedPath + imgSrc;
      // console.log(newImageUrl);
      img.setAttribute("src", newImageUrl);
    } else {
      let newImageUrl = cleanedPath + "/" + imgSrc;
      newImageUrl = newImageUrl.replaceAll("//", "/");
      // console.log(newImageUrl);
      img.setAttribute("src", newImageUrl);
    }
    // remove unneeded img attributes
    // todo use the biggest image in the srcset
    img.removeAttribute("srcset");
    img.removeAttribute("data-srcset");
    img.removeAttribute("sizes");
    img.removeAttribute("loading");
  }
  let styleEl = previewEl.contentDocument.createElement("style");
  styleEl.type = "text/css";
  styleEl.innerText = cssInject;
  previewEl.contentDocument.head.appendChild(styleEl);
}

// Helper: Process in batches to avoid overwhelming the browser
async function processInBatches(items, batchSize, processor) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processor));
  }
}

async function prepareContentPromise(htmlContent) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Define the targets we want to convert to Base64
    const targets = [
      { selector: "img", attribute: "src" },
      { selector: "video[poster]", attribute: "poster" },
    ];

    const conversionTasks = [];

    // Collect all images and video posters
    for (const target of targets) {
      const elements = Array.from(doc.querySelectorAll(target.selector));

      for (const el of elements) {
        const originalUrl = el.getAttribute(target.attribute);

        // Skip empty or already converted sources
        if (!originalUrl || originalUrl.startsWith("data:")) continue;

        try {
          // Resolve absolute URL relative to the current tab
          const absoluteUrl =
            target.selector === "img"
              ? getHighestResUrl(el, currentTabURL)
              : new URL(originalUrl, currentTabURL).href;

          conversionTasks.push(async () => {
            try {
              const dataUrl = await getBase64ImagePromise(absoluteUrl);
              if (dataUrl && dataUrl.startsWith("data:image")) {
                el.setAttribute(target.attribute, dataUrl);
              }
            } catch (e) {
              console.warn(
                `Could not convert ${target.attribute}:`,
                absoluteUrl,
              );
            }
          });
        } catch (e) {
          console.warn(`Invalid URL in ${target.selector}:`, originalUrl);
        }
      }
    }

    // Process image and poster downloads in batches (size 5)
    await processInBatches(conversionTasks, 5, (task) => task());

    // Capture Screenshot
    let imageDataUrl = "";
    if (
      typeof userSettings !== "undefined" &&
      userSettings.enableScreenshotEmbedding
    ) {
      try {
        imageDataUrl = await new Promise((resolve, reject) => {
          browserAPI.tabs.captureVisibleTab(
            null,
            { format: "jpeg", quality: 90 },
            (data) => {
              if (browserAPI.runtime.lastError)
                reject(browserAPI.runtime.lastError);
              else resolve(data);
            },
          );
        });
      } catch (e) {
        console.warn("Screenshot failed:", e);
      }
    }

    // Metadata handling
    const body = doc.body || doc.createElement("body");
    const head = doc.head || doc.createElement("head");

    // Ensure head is attached if it didn't exist
    if (!doc.head) {
      doc.documentElement.insertBefore(head, doc.body);
    }

    // Check if a charset meta already exists
    let charsetMeta = head.querySelector("meta[charset]");

    if (!charsetMeta) {
      // adding <meta charset="utf-8" />
      charsetMeta = doc.createElement("meta");
      charsetMeta.setAttribute("charset", "utf-8");

      // Insert as first child (recommended position)
      head.insertBefore(charsetMeta, head.firstChild);
    }

    let browserName = isChrome ? "Chrome" : "";
    browserName = isEdge ? "Edge" : browserName;
    browserName = isFirefox ? "Firefox" : browserName;

    body.setAttribute(
      "data-createdwith",
      `TagSpaces Web Clipper (${browserName})`,
    );
    body.setAttribute("data-sourceurl", currentTabURL);
    body.setAttribute("data-scrappedon", new Date().toISOString());

    if (imageDataUrl) {
      body.setAttribute("data-screenshot", imageDataUrl);
    }

    // Serialization
    let finalHtml = "";
    if (doc.doctype) {
      finalHtml += new XMLSerializer().serializeToString(doc.doctype) + "\n";
    } else {
      finalHtml += "<!DOCTYPE html>\n";
    }

    finalHtml += doc.documentElement.outerHTML;
    return finalHtml;
  } catch (error) {
    console.error("Content preparation failed:", error);
    return htmlContent;
  }
}

/**
 * Process Markdown content: resolve relative URLs, convert images to Base64,
 * and inject metadata via YAML Front Matter.
 */
async function prepareMarkdownContentPromise(markdownContent) {
  try {
    // Define Regex targets (Standard Markdown images and HTML img tags within MD)
    const regexTargets = [
      // Matches ![alt](url "title") or ![alt](url)
      {
        type: "markdown",
        regex: /!\[(.*?)\]\(((?!data:).+?)(?:\s+"(.*?)")?\)/g,
        urlIndex: 2, // The capture group index for the URL
      },
      // Matches <img src="url" ...>
      {
        type: "html",
        regex: /<img\s+[^>]*src=["']((?!data:)[^"']+)["'][^>]*>/g,
        urlIndex: 1,
      },
    ];

    const conversionTasks = [];
    const replacements = new Map(); // Store Original URL -> Data URL mapping

    // Scan content to find URLs to convert
    for (const target of regexTargets) {
      let match;
      // Reset lastIndex because we are reusing regex objects or looping
      while ((match = target.regex.exec(markdownContent)) !== null) {
        const originalUrl = match[target.urlIndex];

        if (!originalUrl) continue;

        try {
          // Resolve absolute URL relative to the current tab
          // Note: Markdown doesn't have `getHighestResUrl` equivalent easily without DOM,
          // so we usually just resolve the string path.
          const absoluteUrl = new URL(originalUrl, currentTabURL).href;

          // Avoid queuing the same URL multiple times
          if (replacements.has(originalUrl)) continue;

          // Reserve a spot in the map
          replacements.set(originalUrl, null);

          conversionTasks.push(async () => {
            try {
              const dataUrl = await getBase64ImagePromise(absoluteUrl);
              if (dataUrl && dataUrl.startsWith("data:image")) {
                replacements.set(originalUrl, dataUrl);
              } else {
                // If failed, remove from map so we don't replace it with null
                replacements.delete(originalUrl);
              }
            } catch (e) {
              console.warn(`Could not convert image:`, absoluteUrl);
              replacements.delete(originalUrl);
            }
          });
        } catch (e) {
          console.warn(`Invalid URL found in Markdown:`, originalUrl);
        }
      }
    }

    // Process image downloads in batches (size 5)
    await processInBatches(conversionTasks, 5, (task) => task());

    // 4. Apply replacements to the Markdown content
    // We iterate the map to replace occurrences.
    // Note: This matches the raw string. If a URL appears in text (not image), it might get replaced too.
    // To be strictly safe, we could re-run the regex replacement, but global string replacement is usually acceptable for CLippers.
    let finalMarkdown = markdownContent;
    for (const [originalUrl, dataUrl] of replacements) {
      if (dataUrl) {
        // Global replace of the URL.
        // Escaping special regex characters in the URL for the replace function
        const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const replaceRegex = new RegExp(escapedUrl, "g");
        finalMarkdown = finalMarkdown.replace(replaceRegex, dataUrl);
      }
    }

    // // Capture Screenshot (Same logic as original)
    // let imageDataUrl = "";
    // if (
    //   typeof userSettings !== "undefined" &&
    //   userSettings.enableScreenshotEmbedding
    // ) {
    //   try {
    //     imageDataUrl = await new Promise((resolve, reject) => {
    //       browserAPI.tabs.captureVisibleTab(
    //         null,
    //         { format: "jpeg", quality: 90 },
    //         (data) => {
    //           if (browserAPI.runtime.lastError)
    //             reject(browserAPI.runtime.lastError);
    //           else resolve(data);
    //         },
    //       );
    //     });
    //   } catch (e) {
    //     console.warn("Screenshot failed:", e);
    //   }
    // }

    // // Metadata handling (YAML Front Matter)
    // let browserName = isChrome ? "Chrome" : "";
    // browserName = isEdge ? "Edge" : browserName;
    // browserName = isFirefox ? "Firefox" : browserName;

    // const metadata = {
    //   "data-createdwith": `TagSpaces Web Clipper (${browserName})`,
    //   "data-sourceurl": currentTabURL,
    //   "data-scrappedon": new Date().toISOString(),
    //   ...(imageDataUrl ? { "data-screenshot": imageDataUrl } : {}),
    // };

    // finalMarkdown = injectFrontMatter(finalMarkdown, metadata);

    return finalMarkdown;
  } catch (error) {
    console.error("Markdown preparation failed:", error);
    return markdownContent;
  }
}

/**
 * Helper to inject or update YAML Front Matter at the top of the file
 */
function injectFrontMatter(content, newMeta) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontMatterRegex);

  let finalYaml = "";

  if (match) {
    // Existing Front Matter found
    // Note: Parsing YAML without a library is risky, but for simple key-values:
    let existingYaml = match[1];

    // Simple append approach to avoid parsing/destroying existing complex YAML
    let additionalYaml = "";
    for (const [key, value] of Object.entries(newMeta)) {
      // Very basic check to see if key exists (imperfect, but dependency-free)
      if (!existingYaml.includes(`${key}:`)) {
        additionalYaml += `${key}: "${value}"\n`;
      }
    }

    // Replace the entire block with old + new
    return content.replace(
      frontMatterRegex,
      `---\n${existingYaml}\n${additionalYaml}---`,
    );
  } else {
    // No Front Matter, create new
    let yamlBlock = "---\n";
    for (const [key, value] of Object.entries(newMeta)) {
      yamlBlock += `${key}: "${value}"\n`;
    }
    yamlBlock += "---\n\n";
    return yamlBlock + content;
  }
}

export function generateFileName(extension, type) {
  const titleEl = document.getElementById("title");
  let filename = titleEl.value;
  const lastIndexOfDot = filename.lastIndexOf(".");
  // removing the extension if the dot in for 4 or less character before the end of the title
  if (lastIndexOfDot > 0 && filename.length - lastIndexOfDot < 5) {
    filename = filename.substring(0, filename.lastIndexOf("."));
  }

  const rawTags = document.getElementById("tags").value.split(",");
  const tags = [];
  for (let tag of rawTags) {
    let trimmedTag = tag.trim();
    if (trimmedTag.length > 1) {
      // setting minimum tag length of 2
      tags.push(trimmedTag);
    }
  }
  if (type === "screenshot" && extension.toLowerCase() === "png") {
    // screenshot case
    tags.push("screenshot");
    tags.push(currentTabURLParser ? currentTabURLParser.hostname : "");
    tags.push(formatDateTime(new Date(), { dateDelimiter: "" }));
  }
  if (type === "mht") {
    extension = "mhtml";
  }
  if (type === "pdf") {
    extension = "pdf";
  }
  if (tags.length > 0) {
    filename = filename + " [" + tags.join(" ") + "]." + extension;
  } else {
    filename = filename + "." + extension;
  }
  filename = filename.replace(/[/\\?%*:|"<>]/g, "-").trim();
  return filename;
}

export function extractFileExtFromUrl(currentTabURL) {
  let url = currentTabURL;
  if (currentTabURLParser.search) {
    url = currentTabURLParser.origin + currentTabURLParser.pathname;
  }
  const ext = url.replace(/^.*?\.([a-zA-Z0-9]+)$/, "$1");
  return ext.toLowerCase();
}

async function captureFullPage(tabId) {
  const MIN_DELAY = 600; // Ensuring we stay under 2 calls/sec (1000ms / 2 = 500ms + buffer)

  // Get dimensions
  const [{ result: dimensions }] = await browserAPI.scripting.executeScript({
    target: { tabId },
    func: () => ({
      width: Math.max(
        document.documentElement.offsetWidth,
        document.body.scrollWidth,
      ),
      height: Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      ),
      viewportHeight: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    }),
  });

  const { width, height, viewportHeight, dpr } = dimensions;
  const images = [];

  // Helper to hide/show sticky elements (from previous step)
  const setStickyVisibility = async (visible) => {
    await browserAPI.scripting.executeScript({
      target: { tabId },
      func: (isVisible) => {
        // If hiding, store elements to restore them later
        if (!isVisible) {
          window._hiddenStickyNodes = [];
          document.querySelectorAll("*").forEach((node) => {
            const style = window.getComputedStyle(node);
            if (style.position === "fixed" || style.position === "sticky") {
              window._hiddenStickyNodes.push({
                node,
                originalVisibility: node.style.visibility,
              });
              node.style.visibility = "hidden";
            }
          });
        } else if (window._hiddenStickyNodes) {
          window._hiddenStickyNodes.forEach(
            (item) => (item.node.style.visibility = item.originalVisibility),
          );
          delete window._hiddenStickyNodes;
        }
      },
      args: [visible],
    });
  };

  // Helper to capture with Quota handling
  const captureWithRetry = async (retries = 3) => {
    try {
      return await browserAPI.tabs.captureVisibleTab(null, { format: "png" });
    } catch (err) {
      if (
        err.message.includes("MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND") &&
        retries > 0
      ) {
        // Wait 1 second and try again
        await new Promise((r) => setTimeout(r, 1000));
        return captureWithRetry(retries - 1);
      }
      throw err;
    }
  };

  let currentY = 0;
  while (currentY < height) {
    const startTime = Date.now();

    // Scroll to position
    await browserAPI.scripting.executeScript({
      target: { tabId },
      func: (y) => window.scrollTo(0, y),
      args: [currentY],
    });

    // Wait for content to render (min 250ms)
    await new Promise((r) => setTimeout(r, 250));

    // Capture using the retry-protected helper
    const dataUrl = await captureWithRetry();

    const [{ result: actualY }] = await browserAPI.scripting.executeScript({
      target: { tabId },
      func: () => window.scrollY,
    });

    images.push({ dataUrl, y: actualY });

    // AFTER the first capture, hide sticky elements so they don't repeat
    if (currentY === 0) await setStickyVisibility(false);
    if (actualY + viewportHeight >= height) break;
    currentY += viewportHeight;

    // MANDATORY RATE LIMITING:
    // Calculate how long the capture took and wait longer if necessary
    // to ensure we don't exceed 2 calls per second.
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_DELAY) {
      await new Promise((r) => setTimeout(r, MIN_DELAY - elapsed));
    }
  }

  await setStickyVisibility(true);

  // Stitching logic
  const canvas = new OffscreenCanvas(width * dpr, height * dpr);
  const ctx = canvas.getContext("2d");

  for (const item of images) {
    const response = await fetch(item.dataUrl);
    const blob = await response.blob();
    const img = await createImageBitmap(blob);

    // Draw using physical pixel coordinates
    ctx.drawImage(img, 0, Math.round(item.y * dpr));
    img.close();
  }

  return canvas.convertToBlob({ type: "image/png" });
}
