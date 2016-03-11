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

function setDocument(newDocument) {
  document.documentElement.innerHTML = newDocument;
  document.head.appendChild(createHtmlElement('base', 'target', '_blank'));
  document.head.appendChild(createHtmlElement('script', 'src', '/components/iframe-resizer/js/iframeResizer.contentWindow.js'));
  document.head.appendChild(createHtmlElement('script', 'src', '/unifiedinbox/js/helpers/load-images-async.js'));
}

function onMessageReceived(event) {
  var newDocument = getNewDocument(event.data);
  if (newDocument) {
    setDocument(newDocument);
  }
  window.removeEventListener('message', onMessageReceived, false);
}

window.addEventListener('message', onMessageReceived, false);
