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
/* globals $, saveAs, DOMPurify */

$(document).ready(init);

console.log('Loading Popup...');

const isWin = navigator.appVersion.includes('Win');
const dirSeparator = isWin ? '\\' : '/';
const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
const isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
const supportedExts = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'pdf', 'ogg', 'ogv', 'mp4', 'mp3'];
let htmlTemplate = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style type="text/css">body{overflow:auto;width:100%;height:100%;font:13.34px Ubuntu,arial,clean,sans-serif;color:#000;line-height:1.4em;background-color:#fff;padding:15px}p{margin:1em 0;line-height:1.5em}table{font:100%;margin:1em}table th{border-bottom:1px solid #bbb;padding:.2em 1em}table td{border-bottom:1px solid #ddd;padding:.2em 1em}input[type=image],input[type=password],input[type=text],textarea{font:99% helvetica,arial,freesans,sans-serif}option,select{padding:0 .25em}optgroup{margin-top:.5em}code,pre{font:12px Monaco, Courier ,monospace}pre{margin:1em 0;font-size:12px;background-color:#eee;border:1px solid #ddd;padding:5px;line-height:1.5em;color:#444;overflow:auto;-webkit-box-shadow:rgba(0,0,0,.07) 0 1px 2px inset;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px}pre code{padding:0;font-size:12px;background-color:#eee;border:none}code{font-size:12px;background-color:#f8f8ff;color:#444;padding:0 .2em;border:1px solid #dedede}img{border:0;max-width:100%}abbr{border-bottom:none}a{color:#4183c4;text-decoration:none}a:hover{text-decoration:underline}a code,a:link code,a:visited code{color:#4183c4}h2,h3{margin:1em 0}h1,h2,h3,h4,h5,h6{border:0}h1{font-size:170%;border-top:4px solid #aaa;padding-top:.5em;margin-top:1.5em}h1:first-child{margin-top:0;padding-top:.25em;border-top:none}h2{font-size:150%;margin-top:1.5em;border-top:4px solid #e0e0e0;padding-top:.5em}h3{font-size:130%;margin-top:1em}h4{font-size:120%;margin-top:1em}h5{font-size:115%;margin-top:1em}h6{font-size:110%;margin-top:1em}hr{border:1px solid #ddd}ol,ul{margin:1em 0 1em 2em}ol li,ul li{margin-top:.5em;margin-bottom:.5em}ol ol,ol ul,ul ol,ul ul{margin-top:0;margin-bottom:0}blockquote{margin:1em 0;border-left:5px solid #ddd;padding-left:.6em;color:#555}dt{font-weight:700;margin-left:1em}dd{margin-left:2em;margin-bottom:1em}</style></head><body></body></html>';
let fileExt;
let currentTabURL;
let currentTabID;
const activeTabQuery = browser.tabs.query({ active: true });

function init() {
  activeTabQuery.then((tabs) => {
    for (let tab of tabs) {
      currentTabURL = tab.url;
      currentTabID = tab.id;
      fileExt = getFileExt(currentTabURL);
      $('#title').val(tab.title.substring(tab.title.lastIndexOf("/") + 1, tab.title.length));
      $("#saveSelectionAsHtml").attr("disabled", (fileExt !== 'mhtml'));
    }
  }, (err) => { console.log('Error getting activa tab: ' + err) });

  $('#title').focus();
  isFirefox ? $("#saveAsMhtml").hide() : $("#saveAsMhtml").on('click', saveAsMHTML);
  // isChrome ? $("#saveWholePageAsHtml").hide() : '';
  $("#closePopup").on('click', () => window.close());
  $("#saveAsBookmark").on('click', saveAsBookmark);
  $("#saveSelectionAsHtml").on("click", saveSelectionAsHTML);
  $("#saveWholePageAsHtml").on("click", saveWholePageAsHTML);
  $("#saveScreenshot").on("click", saveScreenshot);

  // I18n this panel
  $('[data-i18n]').each(function () {
    $(this).html(browser.i18n.getMessage($(this).data('i18n')));
  });
  $('[data-i18n-title]').each(function () {
    $(this).attr("title", browser.i18n.getMessage($(this).data('i18n-title')));
  });

  browser.runtime.onMessage.addListener(handleHTMLContent);
}

function handleHTMLContent (request) {
  if (request.action == "htmlcontent") {
    //console.log("HTML: " + request.source);
    prepareContentPromise(request.source).then((cleanenHTML) => {
      const htmlBlob = new Blob([cleanenHTML], {
        type: "text/html;charset=utf-8"
      });
      saveAs(htmlBlob, generateFileName('html'));
    }).catch((err) => {
      console.warn('Error handling html content ' + err);
    });
  }
}

function saveAsMHTML() {
  $('#saveAsMhtml i').removeClass('fa-file-image-o').addClass('fa-spin fa-circle-o-notch');
  if (fileExt === 'mhtml') {
    browser.pageCapture.saveAsMHTML({
      tabId: currentTabID
    }, (mhtml) => {
      saveAs(mhtml, generateFileName(fileExt));
    });
  } else {
    browser.downloads.download({
      url: currentTabURL,
      filename: generateFileName(fileExt),
      saveAs: true
    });
  }
}

function saveWholePageAsHTML() {
  $('#saveWholePageAsHtml i').removeClass('fa-file').addClass('fa-spin fa-circle-o-notch');
  const executing = browser.tabs.executeScript(null, {
    file: "content-script-capture-wholepage.dist.js"
  });
  executing.then(() => {
    console.log('Content script injected...');
  }, (err) => console.warn('Error executing script ' + JSON.stringify(err)));
}

function saveSelectionAsHTML() {
  $('#saveSelectionAsHtml i').removeClass('fa-file-text').addClass('fa-spin fa-circle-o-notch');
  const executing = browser.tabs.executeScript(null, {
    file: "content-script-capture-selection.dist.js"
  });
  executing.then(() => {
    console.log('Content script injected...');
  }, (err) => console.warn('Error executing script ' + JSON.stringify(err)));
}

function saveScreenshot() {
  $('#saveScreenshot i').removeClass('fa-camera').addClass('fa-spin fa-circle-o-notch');
  const capturing = browser.tabs.captureVisibleTab(null, {
    "format": "png"
  });
  capturing.then((image) => {
    saveAs(dataURItoBlob(image), generateFileName('png'));
  }, (err) => console.warn('Error taking screenshot ' + JSON.stringify(err)));
}

function saveAsBookmark() {
  $('#saveAsBookmark i').removeClass('fa-bookmark').addClass('fa-spin fa-circle-o-notch');
  const content = '[InternetShortcut]\r\nURL=' + currentTabURL + '';
  const textBlob = new Blob([content], {
    type: "text/plain;charset=utf-8"
  });
  saveAs(textBlob, generateFileName('url'));
}

function generateFileName(extension) {
  let filename = $('#title').val()
  const lastIndexOfDot = filename.lastIndexOf('.');
  // removing the extension if the dot in for 4 or less character before teh end of the title
  if (lastIndexOfDot > 0 && (filename.length - lastIndexOfDot) < 5) {
    filename = filename.substring(0, filename.lastIndexOf('.'))
  }
  let tags = document.getElementById("tags").value;
  if (tags) {
    tags = tags.split(",").join(" ");
    filename = filename + ' [' + tags + '].' + extension;
  } else {
    filename = filename + '.' + extension;
  }
  return filename;
}

function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  const byteString = atob(dataURI.split(',')[1]);
  // separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  // write the bytes of the string to an ArrayBuffer
  const arrayBuffer = new ArrayBuffer(byteString.length);
  let _ia = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    _ia[i] = byteString.charCodeAt(i);
  }
  const dataView = new DataView(arrayBuffer);
  const blob = new Blob([dataView], {
    type: mimeString
  });
  return blob;
}

function getBase64ImagePromise(imgURL) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    let dataURL;
    img.src = imgURL;
    img.crossOrigin = 'anonymous';
    img.onerror = (err) => {
      console.warn('Error fetching image: ' + JSON.stringify(err));
      resolve([imgURL, imgURL]);
    }
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      dataURL = canvas.toDataURL('image/jpeg', 0.9);
      resolve([imgURL, dataURL]);
    }
  });
}

function getFileExt(fileName) {
  const ext = fileName.replace(/^.*?\.([a-zA-Z0-9]+)$/, "$1");
  return (supportedExts.indexOf(ext) >= 0) ? ext : "mhtml";
}

function prepareContentPromise(uncleanedHTML) {
  return new Promise((resolve) => {
    // console.log("uncleaned "+uncleanedHTML);
    console.log("prepareContentPromise for tab with url " + currentTabURL);
    var cleanedHTML = uncleanedHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    // var cleanedHTML = DOMPurify.sanitize(uncleanedHTML);
    // console.log("cleaned "+cleanedHTML);

    // saving all images as jpg in base64 format
    let match;
    const urlPromises = [];
    let originalImgUrl;
    let baseTabPath;
    const rex = /<img.*?src=['"](.*?)['"]/g;
    const imgSources = [];

    while ((match = rex.exec(cleanedHTML)) !== null) {
      imgSources.push(match[1]);
      // console.log(`Found ${match[1]} in ${match[0]}`);
    }
    for (let imgUrl of imgSources) {
      if (imgUrl.startsWith('data')) {
        // ignoring data urls
      } else if (imgUrl.startsWith('http') || imgUrl.startsWith('file')) {
        urlPromises.push(getBase64ImagePromise(imgUrl));
      } else {
        originalImgUrl = imgUrl;
        if (currentTabURL.startsWith('file:')) {
          baseTabPath = currentTabURL.substring(0, currentTabURL.lastIndexOf(dirSeparator) + 1);
          imgUrl = baseTabPath + imgUrl;
        } else {
          imgUrl = currentTabURL + imgUrl;
        }
        cleanedHTML = cleanedHTML.split(originalImgUrl).join(imgUrl);
        urlPromises.push(getBase64ImagePromise(imgUrl));
      }
      console.log("URLs: "+imgUrl);
    }

    Promise.all(urlPromises).then((resultUrls) => {
      resultUrls.forEach((dataURLObject) => {
        cleanedHTML = cleanedHTML.split(dataURLObject[0]).join(dataURLObject[1]);
        //console.log(dataURLObject[0]+" - "+dataURLObject[1]);
      });

      const metaData = 'data-sourceurl="' + currentTabURL + '" data-scrappedon="' + (new Date()).toISOString() + '"';
      if (cleanedHTML.includes('<body')) {
        cleanedHTML = cleanedHTML.split('<body').join('<body ' + metaData);
      } else {
        cleanedHTML = '<body ' + metaData + '>' + cleanedHTML + "</body>";
        cleanedHTML = htmlTemplate.replace(/\<body[^>]*\>([^]*)\<\/body>/m, cleanedHTML);
      }
      // console.log('Content before saving: ' + cleanedHTML);
      return resolve(cleanedHTML);
    }).catch((error) => {
      console.warn('Error by preparing content: ' + error);
      return resolve(cleanedHTML);
    })
  });
}

/* function loadSettingsLocalStorage() {
  try {
    const settings = JSON.parse(localStorage.getItem('tagSpacesSettings'));
    if (settings) {
      htmlTemplate = settings.newHTMLFileContent;
      tagLibrary = settings.tagGroups;
    }
    console.log("Loaded settings from local storage: " + JSON.stringify(tagLibrary));
  } catch (ex) {
    console.log("Loading settings from local storage failed due exception: " + ex);
  }
} */
