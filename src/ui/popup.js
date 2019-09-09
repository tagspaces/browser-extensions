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
/* globals $, saveAs, DOMPurify, OpenLocationCode */
import OptionsManager from "../lib/options-manager.js";

let userSettings = {};
OptionsManager.load().then(options => userSettings = options)

$(document).ready(init);

console.log('Loading Popup...');

const isWin = navigator.appVersion.includes('Win');
const dirSeparator = isWin ? '\\' : '/';
const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
const isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
const supportedExts = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'bmp', 'ico', 'pdf', 'ogg', 'ogv', 'mp4', 'mp3'];
const currentTabURLParser = document.createElement('a');
let cssReadability = 'body{overflow:auto;font: Ubuntu,arial,clean,sans-serif;color:#000;line-height:1.4em;background-color:#fff;padding:20px}p{margin:1em 0;line-height:1.5em}table{font:100%;margin:1em}table th{border-bottom:1px solid #bbb;padding:.2em 1em}table td{border-bottom:1px solid #ddd;padding:.2em 1em}input[type=image],input[type=password],input[type=text],textarea{font:99% helvetica,arial,freesans,sans-serif}option,select{padding:0 .25em}optgroup{margin-top:.5em}code,pre{font:12px Monaco, Courier ,monospace}pre{margin:1em 0;font-size:12px;background-color:#eee;border:1px solid #ddd;padding:5px;line-height:1.5em;color:#444;overflow:auto;-webkit-box-shadow:rgba(0,0,0,.07) 0 1px 2px inset;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px}pre code{padding:0;font-size:12px;background-color:#eee;border:none}code{font-size:12px;background-color:#f8f8ff;color:#444;padding:0 .2em;border:1px solid #dedede}img{border:0;max-width:100%}abbr{border-bottom:none}a{color:#4183c4;text-decoration:none}a:hover{text-decoration:underline}a code,a:link code,a:visited code{color:#4183c4}h2,h3{margin:1em 0}h1,h2,h3,h4,h5,h6{border:0}h1{font-size:170%;border-top:4px solid #aaa;padding-top:.5em;margin-top:1.5em}h1:first-child{margin-top:0;padding-top:.25em;border-top:none}h2{font-size:150%;margin-top:1.5em;border-top:4px solid #e0e0e0;padding-top:.5em}h3{font-size:130%;margin-top:1em}h4{font-size:120%;margin-top:1em}h5{font-size:115%;margin-top:1em}h6{font-size:110%;margin-top:1em}hr{border:1px solid #ddd}ol,ul{margin:1em 0 1em 2em}ol li,ul li{margin-top:.5em;margin-bottom:.5em}ol ol,ol ul,ul ol,ul ul{margin-top:0;margin-bottom:0}blockquote{margin:1em 0;border-left:5px solid #ddd;padding-left:.6em;color:#555}dt{font-weight:700;margin-left:1em}dd{margin-left:2em;margin-bottom:1em}';
let cssReset = '/*! normalize.css v8.0.0 | MIT License | github.com/necolas/normalize.css */button,hr,input{overflow:visible}progress,sub,sup{vertical-align:baseline}[type=checkbox],[type=radio],legend{box-sizing:border-box;padding:0}html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:ButtonText dotted 1px}fieldset{padding:.35em .75em .625em}legend{color:inherit;display:table;max-width:100%;white-space:normal}textarea{overflow:auto}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}[hidden],template{display:none}'
let htmlTemplate = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style type="text/css">' + cssReset + cssReadability + '</style></head><body></body></html>';
let fileExt;
let currentTabURL;
let currentTabID;
let htmlOriginal;
let htmlCleaned;
let htmlSelection;
let contentMode = 'simplified'; // 'original'
const activeTabQuery = browser.tabs.query({currentWindow: true, active: true });

function init() {
  // console.log('Settings: ' + JSON.stringify(userSettings));

  activeTabQuery.then((tabs) => {
    for (let tab of tabs) {
      currentTabURL = tab.url;
      currentTabID = tab.id;
      currentTabURLParser.href = currentTabURL;
      extractLatLong();
      fileExt = extractFileExtFromUrl();
      $('#title').val(tab.title.substring(tab.title.lastIndexOf("/") + 1, tab.title.length));
      $('#title').focus();
      (supportedExts.indexOf(fileExt) >= 0) ? $("#downloadFile").show() : $("#downloadFile").hide();
    }
  }, (err) => { console.warn('Error getting activa tab: ' + err) });

  $('#title').focus();
  isFirefox ? $("#saveAsMhtml").hide() : $("#saveAsMhtml").on('click', saveAsMHTML);
  // isChrome ? $("#saveWholePageAsHtml").hide() : '';
  $("#closePopup").on('click', () => window.close());
  $("#saveAsBookmark").on('click', saveAsBookmark);
  $("#saveSelectionAsHtml").on("click", saveSelectionAsHTML);
  $("#saveWholePageAsHtml").on("click", saveWholePageAsHTML);
  $("#saveScreenshot").on("click", saveScreenshot);
  $("#downloadFile").on('click', downloadFile);
  $("#simplifiedPreview").on('click', simplifiedPreview);
  $("#fullPreview").on('click', fullPreview);

  // I18n this panel
  $('[data-i18n]').each(function () {
    $(this).html(browser.i18n.getMessage($(this).data('i18n')));
  });
  $('[data-i18n-title]').each(function () {
    $(this).attr("title", browser.i18n.getMessage($(this).data('i18n-title')));
  });

  browser.runtime.onMessage.addListener(handleHTML);

  browser.tabs.executeScript(null, {
    file: "content-script-capture-wholepage.dist.js"
  }).then(() => {
    console.log('Content script injected...');
  }, (err) => {
    console.warn('Error executing script ' + JSON.stringify(err));
    $('#preview').contents().find('html').html('Error while capturing content');
    // alert('Error getting content from the current tab.')
    // location.reload();
  });

  browser.tabs.executeScript(null, {
    file: "content-script-capture-selection.dist.js"
  }).then(() => {
    console.log('Content script injected...');
  }, (err) => {
    console.warn('Error executing script ' + JSON.stringify(err));
    $('#preview').contents().find('html').html('Error while capturing content');
    // alert('Error getting content from the current tab.')
    // location.reload();
  });
}

// Geo locations:
// GMaps: https://www.google.de/maps/@48.1401285,11.5732137,15.25z
// GMaps: https://www.google.de/maps/@-20.8096591,-49.3801033,16z
// OpenStreetMap: https://www.openstreetmap.org/#map=17/48.13504/11.59057
// OpenStreetMap: https://www.openstreetmap.org/#map=16/-20.8077/-49.3785
// Here: https://wego.here.com/?map=-20.80625,-49.37421,16,normal
// Bing: no url param
function extractLatLong() {
  // const regex = new RegExp('@(.*),(.*),'); // gmaps only
  const regexGMH = new RegExp('(map=|@)(.*),(.*),'); // gmaps and here
  const regexOSM = new RegExp('\\d/(.*)/(.*)'); // open street map
  if (currentTabURLParser.href) {
    let lonLatMatch = currentTabURLParser.href.match(regexGMH);
    let lonLatMatch2 = currentTabURLParser.href.match(regexOSM);
    let lon;
    let lat;
    if (lonLatMatch && lonLatMatch.length > 1) {
      lon = lonLatMatch[2];
      lat = lonLatMatch[3];
    } else if (lonLatMatch2 && lonLatMatch2.length > 0) {
      lon = lonLatMatch2[1];
      lat = lonLatMatch2[2];
    }
    if (lon && lat) {
      let geoTag;
      if (OpenLocationCode && userSettings.enableOpenLocationCode) {
        try {
          geoTag = OpenLocationCode.encode(parseFloat(lon), parseFloat(lat));
        } catch (err) {
          console.warn('Error parsing lat long to float');
        }
      } else {
        if (!lat.startsWith('-')) {
          lat = '+' + lat;
        }
        geoTag = lon + lat;
      }
      $('#tags').val($('#tags').val() + ' ' + geoTag + ' ');
    }
  }
}

function saveAsFile(blob, filename) {
  if (isFirefox) {
    saveAs(blob, filename);
  } else {
    browser.downloads.download({
      url: URL.createObjectURL(blob),
      filename: filename,
      saveAs: true
    });
  }
}

function handleHTML(request) {
  if (request.action == "htmlcontent") {
    // console.log("HTML: " + request.source);
    htmlOriginal = request.originalHTML;
    htmlCleaned = request.cleanedHTML;
  }
  if (request.action == "htmlselection") {
    // console.log("HTML: " + request.source);
    if (request.source.length < 1) {
      // alert('No content selected....');
    } else {
      htmlSelection = request.source;
    }
  }
  if (htmlSelection) {
    $('#preview').contents().find('html').html(htmlSelection);
    // $('#saveWholePageAsHtml').attr("disabled",true);
    // $('#saveSelectionAsHtml').attr("disabled",false);
    return;
  } else if (htmlCleaned) {
    $('#preview').contents().find('html').html(htmlCleaned);
    // $('#saveSelectionAsHtml').attr("disabled",true);
    // $('#saveWholePageAsHtml').attr("disabled",false);
    contentMode = 'simplified';
    return;
  } else if (htmlOriginal) {
    $('#preview').contents().find('html').html(htmlOriginal);
    // $('#saveSelectionAsHtml').attr("disabled",true);
    // $('#saveWholePageAsHtml').attr("disabled",false);
    contentMode = 'original';
    return;
  } else {
    $('#contentModeSwitch').hide();
    $('#preview').contents().find('html').html('No content was extracted...');
  }
}

function simplifiedPreview() {
  if (htmlCleaned) {
    contentMode = 'simplified';
    $('#preview').contents().find('html').html(htmlCleaned);
  }
}

function fullPreview() {
  if (htmlOriginal) {
    contentMode = 'original';
    $('#preview').contents().find('html').html(htmlOriginal);
  }
}

function saveAsMHTML() {
  $('#saveAsMhtml i').removeClass('fa-file-image-o').addClass('fa-spin fa-circle-o-notch');
  browser.pageCapture.saveAsMHTML({
    tabId: currentTabID
  }, (mhtml) => {
    saveAsFile(mhtml, generateFileName(fileExt, 'mht'));
    $('#saveAsMhtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file-image-o');
  });
}

function downloadFile() {
  browser.downloads.download({
    url: currentTabURL,
    filename: generateFileName(fileExt),
    saveAs: true
  });
}

function saveWholePageAsHTML() {
  $('#saveWholePageAsHtml i').removeClass('fa-file').addClass('fa-spin fa-circle-o-notch');
  let content = '';
  if (contentMode === 'simplified') {
    content = htmlCleaned;
  } else if (contentMode === 'original') {
    content = htmlOriginal;
  }
  if (!content || content.length < 1) {
    alert('No content extracted....');
    $('#saveWholePageAsHtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file');
    $('#saveSelectionAsHtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file-text');
    return;
  }
  prepareContentPromise(content).then((convertedHTML) => {
    const htmlBlob = new Blob([convertedHTML], {
      type: "text/html;charset=utf-8"
    });
    saveAsFile(htmlBlob, generateFileName('html'));
    $('#saveWholePageAsHtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file');
    $('#saveSelectionAsHtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file-text');
  }).catch((err) => {
    alert('Error by preparing the HTML content...');
    location.reload();
    console.warn('Error handling html content ' + err);
  });
}

function saveSelectionAsHTML() {
  $('#saveSelectionAsHtml i').removeClass('fa-file-text').addClass('fa-spin fa-circle-o-notch');
  if (!htmlSelection || htmlSelection.length < 1) {
    alert('No content selected....');
    $('#saveWholePageAsHtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file');
    $('#saveSelectionAsHtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file-text');
    return;
  }
  prepareContentPromise(htmlSelection).then((cleanenHTML) => {
    const htmlBlob = new Blob([cleanenHTML], {
      type: "text/html;charset=utf-8"
    });
    saveAsFile(htmlBlob, generateFileName('html'));
    $('#saveWholePageAsHtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file');
    $('#saveSelectionAsHtml i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-file-text');
  }).catch((err) => {
    alert('Error by preparing the HTML content...');
    // location.reload();
    console.warn('Error handling html content ' + err);
  });
}

function saveScreenshot() {
  $('#saveScreenshot i').removeClass('fa-camera').addClass('fa-spin fa-circle-o-notch');
  const capturing = browser.tabs.captureVisibleTab(null, {
    "format": "png"
  });
  capturing.then((image) => {
    saveAsFile(dataURItoBlob(image), generateFileName('png', 'screenshot'));
    $('#saveScreenshot i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-camera');
  }, (err) => console.warn('Error taking screenshot ' + JSON.stringify(err)));
}

function saveAsBookmark() {
  $('#saveAsBookmark i').removeClass('fa-bookmark').addClass('fa-spin fa-circle-o-notch');
  const capturing = browser.tabs.captureVisibleTab(null, {"format": "jpeg"});
  capturing.then((imageDataUrl) => { // Make capturing optional, evtl. resize the image
    const screenshot = userSettings.enableScreenshotEmbedding ? 'COMMENT=' + imageDataUrl + '\r\n' : ''
    const content = '[InternetShortcut]\r\nURL=' + currentTabURL + '\r\n' + screenshot;
    const textBlob = new Blob([content], {
      type: "text/plain;charset=utf-8"
    });
    saveAsFile(textBlob, generateFileName('url'));
    $('#saveAsBookmark i').removeClass('fa-spin fa-circle-o-notch').addClass('fa-bookmark');
  });
}

function generateFileName(extension, type) {
  let filename = $('#title').val()
  const lastIndexOfDot = filename.lastIndexOf('.');
  // removing the extension if the dot in for 4 or less character before the end of the title
  if (lastIndexOfDot > 0 && (filename.length - lastIndexOfDot) < 5) {
    filename = filename.substring(0, filename.lastIndexOf('.'))
  }

  const rawTags = document.getElementById("tags").value.split(",");
  const tags = [];
  for (let tag of rawTags) {
    let trimmedTag = tag.trim();
    if (trimmedTag.length > 1) { // setting minimum tag length of 2
      tags.push(trimmedTag);
    }
  }
  if (type === 'screenshot' && extension.toLowerCase() === 'png') { // screenshot case
    tags.push('screenshot');
    tags.push(currentTabURLParser ? currentTabURLParser.hostname : '');
    tags.push(formatDateTime4Tag((new Date()).toString(), false));
  }
  if (type === 'mht') {
    extension = 'mhtml';
  }
  if (tags.length > 0) {
    filename = filename + ' [' + tags.join(" ") + '].' + extension;
  } else {
    filename = filename + '.' + extension;
  }
  filename = filename.replace(/[/\\?%*:|"<>]/g, '-');
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
    let mimeType = 'image/jpeg';
    // if (imgURL.endsWith('gif')) {
    //   mimeType = 'image/gif';
    // }
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
      try {
        dataURL = canvas.toDataURL(mimeType, 0.9);
        resolve([imgURL, dataURL]);
      } catch (e) {
        resolve(['', dataURL]);
      }
    }
  });
}

function extractFileExtFromUrl() {
  let url = currentTabURL;
  if (currentTabURLParser.search) {
    url = currentTabURLParser.origin + currentTabURLParser.pathname;
  }
  const ext = url.replace(/^.*?\.([a-zA-Z0-9]+)$/, "$1");
  return ext.toLowerCase();
}

function prepareContentPromise(uncleanedHTML) {
  return new Promise((resolve) => {
    // let cleanedHTML = uncleanedHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    let cleanedHTML = DOMPurify.sanitize(uncleanedHTML);

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
        } else if (imgUrl.startsWith('/')) {
          imgUrl = currentTabURLParser.origin + imgUrl
        } else {
          imgUrl = currentTabURL + imgUrl;
        }
        cleanedHTML = cleanedHTML.split(originalImgUrl).join(imgUrl);
        urlPromises.push(getBase64ImagePromise(imgUrl));
      }
      // console.log("URLs: " + imgUrl);
    }

    Promise.all(urlPromises).then((resultUrls) => {
      resultUrls.forEach((dataURLObject) => {
        cleanedHTML = cleanedHTML.split(' src="' + dataURLObject[0]).join(' src="' + dataURLObject[1]); // ensure to replace only src="..." and not data-src=".."
        if (cleanedHTML.includes("src='")) {
          cleanedHTML = cleanedHTML.split(" src='" + dataURLObject[0]).join(" src='" + dataURLObject[1]);
        }
        // cleanedHTML = cleanedHTML.split(dataURLObject[0]).join(dataURLObject[1]);
      });

      const capturing = browser.tabs.captureVisibleTab(null, {"format": "jpeg"});
      capturing.then((imageDataUrl) => { // Make capturing optional, evtl. resize the image
        let metaData = 'data-sourceurl="' + currentTabURL + '" data-scrappedon="' + (new Date()).toISOString() + '"';
        if (imageDataUrl && userSettings.enableScreenshotEmbedding) {
          metaData = metaData + ' data-screenshot="' + imageDataUrl + '"';
        }
        if (cleanedHTML.includes('<body')) {
          cleanedHTML = cleanedHTML.split('<body').join('<body ' + metaData);
        } else {
          cleanedHTML = '<body ' + metaData + '>' + cleanedHTML + "</body>";
          cleanedHTML = htmlTemplate.replace(/<body[^>]*>([^]*)<\/body>/m, cleanedHTML);
        }
        // console.log('Content before saving: ' + cleanedHTML);
        return resolve(cleanedHTML);
      }, (err) => console.warn('Error taking screenshot ' + JSON.stringify(err)));
    }).catch((error) => {
      console.warn('Error by preparing content: ' + error);
      return resolve(cleanedHTML);
    })
  });
}

function formatDateTime4Tag(date, includeTime) {
  if (date === undefined || date === '') {
    return '';
  }
  const d = new Date(date);
  let cDate = d.getDate();
  cDate += '';
  if (cDate.length === 1) {
    cDate = '0' + cDate;
  }
  let cMonth = d.getMonth();
  cMonth++;
  cMonth += '';
  if (cMonth.length === 1) {
    cMonth = '0' + cMonth;
  }
  const cYear = d.getFullYear();

  let time = '';
  if (includeTime) {
    let cHour = d.getHours();
    cHour += '';
    if (cHour.length === 1) {
      cHour = '0' + cHour;
    }
    let cMinute = d.getMinutes();
    cMinute += '';
    if (cMinute.length === 1) {
      cMinute = '0' + cMinute;
    }
    let cSecond = d.getSeconds();
    cSecond += '';
    if (cSecond.length === 1) {
      cSecond = '0' + cSecond;
    }
    time = '~' + cHour + '' + cMinute + '' + cSecond;
  }

  return cYear + '' + cMonth + '' + cDate + time;
}

