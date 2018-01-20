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

function DOMtoString(document_root) {
  var html = '',
    node = document_root.firstChild;
  while (node) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        html += node.outerHTML;
        break;
      case Node.TEXT_NODE:
        html += node.nodeValue;
        break;
      case Node.CDATA_SECTION_NODE:
        html += '<![CDATA[' + node.nodeValue + ']]>';
        break;
      case Node.COMMENT_NODE:
        html += '<!--' + node.nodeValue + '-->';
        break;
      case Node.DOCUMENT_TYPE_NODE:
        // (X)HTML documents are identified by public identifiers
        html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
        break;
    }
    node = node.nextSibling;
  }
  return html;
}

function getSelectionHtml() {
  var html = "";
  if (typeof window.getSelection != "undefined") {
    var sel = window.getSelection();
    if (sel.rangeCount) {
      var container = document.createElement("div");
      for (var i = 0, len = sel.rangeCount; i < len; ++i) {
        container.appendChild(sel.getRangeAt(i).cloneContents());
      }
      html = container.innerHTML;
    }
  } else if (typeof document.selection != "undefined") {
    if (document.selection.type == "Text") {
      html = document.selection.createRange().htmlText;
    }
  }
  return html;
}

if (isFirefox) {
  browser.runtime.sendMessage({
    action: "htmlcontent",
    source: getSelectionHtml()
  });
} else {
  chrome.runtime.sendMessage({
    action: "htmlcontent",
    //source: DOMtoString(document)
    source: getSelectionHtml()
  });
}

/*
 function adjustRange(range) {
 range = range.cloneRange();

 // Expand range to encompass complete element if element's text
 // is completely selected by the range
 var container = range.commonAncestorContainer;
 var parentElement = container.nodeType == 3 ?
 container.parentNode : container;

 if (parentElement.textContent == range.toString()) {
 range.selectNode(parentElement);
 }

 return range;
 }

 function getSelectionHtml(selection) {
 var html = "", sel, range;
 if (typeof selection != "undefined") {
 sel = selection;
 if (sel.rangeCount) {
 var container = document.createElement("div");
 for (var i = 0, len = sel.rangeCount; i < len; ++i) {
 range = adjustRange( sel.getRangeAt(i) );
 container.appendChild(range.cloneContents());
 }
 html = container.innerHTML;
 }
 }
 //else if (typeof document.selection != "undefined") {
 //    if (document.selection.type == "Text") {
 //        html = document.selection.createRange().htmlText;
 //    }
 //}
 return html;
 }*/
