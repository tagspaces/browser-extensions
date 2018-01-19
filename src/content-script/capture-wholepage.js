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

