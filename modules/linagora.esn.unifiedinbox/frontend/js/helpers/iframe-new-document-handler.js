'use strict';

var handlers = {
  '[linagora.esn.unifiedinbox.changeDocument]': setDocument,
  '[linagora.esn.unifiedinbox.inlineAttachment]': replaceInlineImageUrl
};

function createHtmlElement(tag, attribute, value) {
  var element = document.createElement(tag);

  element.setAttribute(attribute, value);

  return element;
}

function absoluteUrl(url) {
  return createHtmlElement('a', 'href', url).href;
}

function setDocument(newDocument) {
  // The new document can declare a <base href="xxx"> so we ask for absolute urls before updating the document
  var scriptsToInclude = [
    absoluteUrl('/unifiedinbox/js/helpers/load-images-async.js'), // This one must come first, see the script for details
    absoluteUrl('/components/iframe-resizer/js/iframeResizer.contentWindow.js')
  ];

  document.documentElement.innerHTML = newDocument;
  document.head.appendChild(createHtmlElement('base', 'target', '_blank'));
  scriptsToInclude.forEach(function(script) {
    document.head.appendChild(createHtmlElement('script', 'src', script));
  });

  var cssToInclude = createHtmlElement('link', 'rel', 'stylesheet');
  cssToInclude.setAttribute('href', absoluteUrl('/unifiedinbox/css/static/iframe.css'));

  document.head.appendChild(cssToInclude);

  // mailto: URLs will open a composer
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="mailto"]'), function(element) {
    element.onclick = function(event) {
      event.preventDefault();

      parent.postMessage('[linagora.esn.unifiedinbox.mailtoClick]' + element.href.replace('mailto:', ''), '*');
    };
  });

  // Inline images will be downloaded, we must go through the host window for that
  Array.prototype.forEach.call(document.querySelectorAll('img[data-async-src^="cid:"]'), function(element) {
    var cid = element.getAttribute('data-async-src').replace('cid:', '');

    element.removeAttribute('data-async-src');
    element.setAttribute('data-inline-image', cid); // For easy lookup later on

    parent.postMessage('[linagora.esn.unifiedinbox.inlineAttachment]' + cid, '*');
  });
}

function replaceInlineImageUrl(cidAndUrl) {
  var split = cidAndUrl.split(' '),
      cid = split[0],
      url = split[1],
      element = document.querySelector('img[data-inline-image="' + cid + '"]');

  if (element) {
    element.onload = function() {
      window.parentIFrame.size();
    };
    element.src = url;
  }
}

function onMessageReceived(event) {
  var message = '' + event.data;

  Object.keys(handlers).forEach(function(prefix) {
    if (prefix === message.substr(0, prefix.length)) {
      handlers[prefix](message.substr(prefix.length));
    }
  });
}

window.addEventListener('message', onMessageReceived, false);
