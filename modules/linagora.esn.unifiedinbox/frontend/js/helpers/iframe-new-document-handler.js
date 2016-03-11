'use strict';

var messagePrefix = '[linagora.esn.unifiedinbox]',
    messagePrefixLength = messagePrefix.length;

function getNewDocument(messageData) {
  var stringMessageData = '' + messageData;
  if (messagePrefix === stringMessageData.substr(0, messagePrefixLength)) {
    return stringMessageData.substr(messagePrefixLength);
  }
}

function createHtmlElement(tag, attribute, value) {
  var element = document.createElement(tag);
  element.setAttribute(attribute, value);
  return element;
}

function absoluteUrl(url) {
  return createHtmlElement('a', 'href', url).href;
}

function setDocument(newDocument) {
  // The new document can declare a <base href="xxx">,
  // so we ask for absolute urls before updating the document
  var scriptsToInclude = [
    absoluteUrl('/components/iframe-resizer/js/iframeResizer.contentWindow.js'),
    absoluteUrl('/unifiedinbox/js/helpers/load-images-async.js')
  ];

  document.documentElement.innerHTML = newDocument;
  document.head.appendChild(createHtmlElement('base', 'target', '_blank'));
  scriptsToInclude.forEach(function(script) {
    document.head.appendChild(createHtmlElement('script', 'src', script));
  });
}

function onMessageReceived(event) {
  var newDocument = getNewDocument(event.data);
  if (newDocument) {
    setDocument(newDocument);
  }
  window.removeEventListener('message', onMessageReceived, false);
}

window.addEventListener('message', onMessageReceived, false);
