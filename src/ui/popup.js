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
  formatDateTime4Tag,
  getBase64ImagePromise,
  dataURItoBlob,
  extractLatLong,
} from "../lib/utils.js";
import { Readability, isProbablyReaderable } from "@mozilla/readability";
import * as DOMPurify from "dompurify";

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

console.log("Loading Popup...");

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
const cssReadability =
  "body{overflow:auto;font: Ubuntu,arial,clean,sans-serif;color:#000;line-height:1.4em;background-color:#fff;padding:20px}p{margin:1em 0;line-height:1.5em}table{font:100%;margin:1em}table th{border-bottom:1px solid #bbb;padding:.2em 1em}table td{border-bottom:1px solid #ddd;padding:.2em 1em}input[type=image],input[type=password],input[type=text],textarea{font:99% helvetica,arial,freesans,sans-serif}option,select{padding:0 .25em}optgroup{margin-top:.5em}code,pre{font:12px Monaco, Courier ,monospace}pre{margin:1em 0;font-size:12px;background-color:#eee;border:1px solid #ddd;padding:5px;line-height:1.5em;color:#444;overflow:auto;-webkit-box-shadow:rgba(0,0,0,.07) 0 1px 2px inset;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px}pre code{padding:0;font-size:12px;background-color:#eee;border:none}code{font-size:12px;background-color:#f8f8ff;color:#444;padding:0 .2em;border:1px solid #dedede}img{border:0;max-width:100%}abbr{border-bottom:none}a{color:#4183c4;text-decoration:none}a:hover{text-decoration:underline}a code,a:link code,a:visited code{color:#4183c4}h2,h3{margin:1em 0}h1,h2,h3,h4,h5,h6{border:0}h1{font-size:170%;border-top:4px solid #aaa;padding-top:.5em;margin-top:1.5em}h1:first-child{margin-top:0;padding-top:.25em;border-top:none}h2{font-size:150%;margin-top:1.5em;border-top:4px solid #e0e0e0;padding-top:.5em}h3{font-size:130%;margin-top:1em}h4{font-size:120%;margin-top:1em}h5{font-size:115%;margin-top:1em}h6{font-size:110%;margin-top:1em}hr{border:1px solid #ddd}ol,ul{margin:1em 0 1em 2em}ol li,ul li{margin-top:.5em;margin-bottom:.5em}ol ol,ol ul,ul ol,ul ul{margin-top:0;margin-bottom:0}blockquote{margin:1em 0;border-left:5px solid #ddd;padding-left:.6em;color:#555}dt{font-weight:700;margin-left:1em}dd{margin-left:2em;margin-bottom:1em}";
const cssReset =
  "/*! normalize.css v8.0.0 | MIT License | github.com/necolas/normalize.css */button,hr,input{overflow:visible}progress,sub,sup{vertical-align:baseline}[type=checkbox],[type=radio],legend{box-sizing:border-box;padding:0}html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:ButtonText dotted 1px}fieldset{padding:.35em .75em .625em}legend{color:inherit;display:table;max-width:100%;white-space:normal}textarea{overflow:auto}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}[hidden],template{display:none}";

const cssInject = `
  img, figure, video { 
    max-width: 100%; 
    height: auto; 
  } 
  html { overflow-x: hidden; }
`;
let htmlTemplate =
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><style type="text/css">' +
  // cssReset +
  cssReadability +
  cssInject +
  "</style></head><body></body></html>";
let fileExt;
let currentTabURL;
let currentTabID;
let htmlOriginal;
let htmlCleaned;
let htmlSelection;
let documentBaseUri;
let contentMode = "simplified"; // 'original'
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
    }
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
    .getElementById("saveSelectionAsHtml")
    .addEventListener("click", saveSelectionAsHTML);
  document
    .getElementById("saveWholePageAsHtml")
    .addEventListener("click", saveWholePageAsHTML);
  document
    .getElementById("saveScreenshot")
    .addEventListener("click", saveScreenshot);
  document
    .getElementById("downloadFile")
    .addEventListener("click", downloadFile);
  document
    .getElementById("simplifiedPreview")
    .addEventListener("click", simplifiedPreview);
  document.getElementById("fullPreview").addEventListener("click", fullPreview);

  // I18n this panel
  document.querySelectorAll("[data-i18n]").forEach((item) => {
    item.innerHTML = browserAPI.i18n.getMessage(item.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((item) => {
    item.setAttribute(
      "title",
      browserAPI.i18n.getMessage(item.dataset.i18nTitle)
    );
  });

  browserAPI.runtime.onMessage.addListener(handleHTML);

  const responseSelection = await browserAPI.runtime.sendMessage({
    type: "capture-selection",
    tabId: currentTabID,
  });
  // console.log(
  //   "Capture selection received: " + JSON.stringify(responseSelection)
  // );

  const responsePage = await browserAPI.runtime.sendMessage({
    type: "capture-page",
    tabId: currentTabID,
  });
  // console.log("Capture page received: " + JSON.stringify(responsePage));

  function handleHTML(msg, sender, sendResponse) {
    documentBaseUri = msg.documentBaseUri;
    // host: "www.tagspaces.com"
    // pathBase: "https://www.tagspaces.com/articles/"
    // prePath: "https://www.tagspaces.com"
    // scheme: "https"
    // spec: "https://www.tagspaces.com/articles/testarticle
    const previewEl = document.getElementById("preview");
    if (msg.action == "htmlcontent") {
      htmlOriginal = DOMPurify.sanitize(msg.originalHTML);
    }
    if (msg.action == "htmlselection") {
      if (msg.originalHTML.length < 1) {
        // alert('No content selected....');
      } else {
        htmlSelection = DOMPurify.sanitize(msg.originalHTML);
      }
    }

    const previewHtmlEl = previewEl.contentDocument.documentElement;

    if (htmlSelection) {
      updatePreviewArea(htmlSelection);
    } else if (htmlOriginal) {
      updatePreviewArea(htmlOriginal);
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
        contentMode = "simplified";
      }
    } else {
      // document.getElementById("saveSelectionAsHtml").style.display = "none";
      updatePreviewArea("No content was extracted...");
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

function simplifiedPreview() {
  if (htmlCleaned) {
    contentMode = "simplified";
    updatePreviewArea(htmlCleaned);
  }
}

function fullPreview() {
  if (htmlOriginal) {
    contentMode = "original";
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
    }
  );
}

function downloadFile() {
  browserAPI.downloads.download({
    url: currentTabURL,
    filename: generateFileName(fileExt),
    saveAs: true,
  });
}

function saveWholePageAsHTML() {
  const saveAsHTMLSpinner = document.querySelector("#saveAsHTMLSpinner");
  saveAsHTMLSpinner.classList.remove("d-none");
  let content = "";
  if (contentMode === "simplified") {
    content = htmlCleaned;
  } else if (contentMode === "original") {
    content = htmlOriginal;
  }
  if (!content || content.length < 1) {
    alert("No content extracted....");
    saveAsHTMLSpinner.classList.add("d-none");
    return;
  }
  prepareContentPromise(content)
    .then((convertedHTML) => {
      const htmlBlob = new Blob([convertedHTML], {
        type: "text/html;charset=utf-8",
      });
      saveAsFile(htmlBlob, generateFileName("html"));
      saveAsHTMLSpinner.classList.add("d-none");
    })
    .catch((err) => {
      console.warn("Error handling html content " + err);
      alert("Error by preparing the HTML content...");
      location.reload();
    });
}

function saveSelectionAsHTML() {
  const saveSelectionAsHtmlSpinner = document.querySelector(
    "#saveSelectionAsHtmlSpinner"
  );
  saveSelectionAsHtmlSpinner.classList.remove("d-none");
  if (!htmlSelection || htmlSelection.length < 1) {
    alert("No content selected....");
    saveSelectionAsHtmlSpinner.classList.add("d-none");
    return;
  }
  prepareContentPromise(htmlSelection)
    .then((cleanenHTML) => {
      const htmlBlob = new Blob([cleanenHTML], {
        type: "text/html;charset=utf-8",
      });
      saveAsFile(htmlBlob, generateFileName("html"));
      saveSelectionAsHtmlSpinner.classList.add("d-none");
    })
    .catch((err) => {
      alert("Error by preparing the HTML content...");
      // location.reload();
      console.warn("Error handling html content " + err);
    });
}

function saveScreenshot() {
  const saveScreenshotSpinner = document.querySelector(
    "#saveScreenshotSpinner"
  );
  saveScreenshotSpinner.classList.remove("d-none");
  const capturing = browserAPI.tabs.captureVisibleTab(undefined, {
    format: "png",
  });
  capturing.then(
    (image) => {
      saveAsFile(dataURItoBlob(image), generateFileName("png", "screenshot"));
      saveScreenshotSpinner.classList.add("d-none");
    },
    (err) => {
      saveScreenshotSpinner.classList.add("d-none");
      console.warn("Error taking screenshot " + JSON.stringify(err));
    }
  );
}

function savePDF() {
  const saveAsMhtmlSpinner = document.querySelector("#saveAsMhtmlSpinner");
  saveAsMhtmlSpinner.classList.remove("d-none");
  const capturing = browserAPI.tabs.saveAsPDF({});
  capturing.then(
    (image) => {
      saveAsFile(dataURItoBlob(image), generateFileName("pdf"));
      saveAsMhtmlSpinner.classList.add("d-none");
    },
    (err) => console.warn("Error saving as PDF " + JSON.stringify(err))
  );
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
  // console.log(previewHtmlEl.innerHTML);
  const allSource = previewHtmlEl.getElementsByTagName("source");
  for (const source of allSource) {
    // console.log("srcset: " + source.srcset);
    source.setAttribute("srcset", "");
  }

  // Fix relative urls in links
  const allLinks = previewHtmlEl.getElementsByTagName("a");
  for (const link of allLinks) {
    const linkHref = link.getAttribute("href");
    if (linkHref.startsWith("/")) {
      const newLinkUrl = documentBaseUri.prePath + linkHref;
      // console.log(newImageUrl);
      link.setAttribute("href", newLinkUrl);
    }
  }

  // Fix svg icons shown in full width
  const allSVGs = previewHtmlEl.getElementsByTagName("svg");
  for (const svg of allSVGs) {
    svg.style.maxWidth = "100px"; // svg.getAttribute("naturalWidth");
  }

  const allImages = previewHtmlEl.getElementsByTagName("img");
  for (const img of allImages) {
    const imgSrc = img.getAttribute("src");
    // console.log(imgSrc);
    // img.setAttribute("width", img.getAttribute("naturalWidth"));
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
    } else {
      const newImageUrl = documentBaseUri.pathBase + "/" + imgSrc;
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

function prepareContentPromise(htmlContent) {
  return new Promise((resolve) => {
    // saving all images as jpg in base64 format
    let match;
    const urlPromises = [];
    let originalImgUrl;
    let baseTabPath;
    const rex = /<img.*?src=['"](.*?)['"]/g;
    const imgSources = [];

    while ((match = rex.exec(htmlContent)) !== null) {
      imgSources.push(match[1]);
      // console.log(`Found ${match[1]} in ${match[0]}`);
    }
    for (let imgUrl of imgSources) {
      if (imgUrl.startsWith("data:image")) {
        // ignoring data urls
      } else if (imgUrl.startsWith("http") || imgUrl.startsWith("file")) {
        urlPromises.push(getBase64ImagePromise(imgUrl));
      } else {
        originalImgUrl = imgUrl;
        if (currentTabURL.startsWith("file:")) {
          baseTabPath = currentTabURL.substring(
            0,
            currentTabURL.lastIndexOf(dirSeparator) + 1
          );
          imgUrl = baseTabPath + imgUrl;
        } else if (imgUrl.startsWith("/")) {
          imgUrl = currentTabURLParser.origin + imgUrl;
        } else {
          imgUrl = currentTabURL + imgUrl;
        }
        htmlContent = htmlContent.split(originalImgUrl).join(imgUrl);
        urlPromises.push(getBase64ImagePromise(imgUrl));
      }
      // console.log("URLs: " + imgUrl);
    }

    Promise.all(urlPromises)
      .then((resultUrls) => {
        resultUrls.forEach((dataURLObject) => {
          htmlContent = htmlContent
            .split(' src="' + dataURLObject[0])
            .join(' src="' + dataURLObject[1]); // ensure to replace only src="..." and not data-src=".."
          if (htmlContent.includes("src='")) {
            htmlContent = htmlContent
              .split(" src='" + dataURLObject[0])
              .join(" src='" + dataURLObject[1]);
          }
          // cleanedHTML = cleanedHTML.split(dataURLObject[0]).join(dataURLObject[1]);
        });

        const capturing = browserAPI.tabs.captureVisibleTab(null, {
          format: "jpeg",
          quality: 95,
        });
        capturing.then(
          (imageDataUrl) => {
            let browserName = isChrome ? " (Chrome)" : "";
            browserName = isEdge ? " (Edge)" : browserName;
            browserName = isFirefox ? " (Firefox)" : browserName;
            let metaData =
              '\ndata-createdwith="TagSpaces Web Clipper' +
              browserName +
              '"' +
              '\ndata-sourceurl="' +
              currentTabURL +
              '" \ndata-scrappedon="' +
              new Date().toISOString() +
              '"';
            if (imageDataUrl && userSettings.enableScreenshotEmbedding) {
              metaData =
                metaData + ' \ndata-screenshot="' + imageDataUrl + '"\n';
            }
            if (htmlContent.includes("<body")) {
              htmlContent = htmlContent
                .split("<body")
                .join("<body " + metaData);
            } else {
              htmlContent =
                "\n<body " + metaData + ">" + htmlContent + "</body>";
              htmlContent = htmlTemplate.replace(
                /<body[^>]*>([^]*)<\/body>/m,
                htmlContent
              );
            }
            // console.log('Content before saving: ' + cleanedHTML);
            return resolve(htmlContent);
          },
          (err) =>
            console.warn("Error taking screenshot " + JSON.stringify(err))
        );
      })
      .catch((error) => {
        console.warn("Error by preparing content: " + error);
        return resolve(htmlContent);
      });
  });
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
    tags.push(formatDateTime4Tag(new Date().toString(), false));
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
