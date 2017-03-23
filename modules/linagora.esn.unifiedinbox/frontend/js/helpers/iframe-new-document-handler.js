'use strict';

var handlers = {
  '[linagora.esn.unifiedinbox.changeDocument]': setDocument,
  '[linagora.esn.unifiedinbox.inlineAttachment]': replaceInlineImageUrl
};

function createHtmlElement(tag) {
  var element = document.createElement(tag);

  for (var i = 1; i < arguments.length; i += 2) {
    element.setAttribute(arguments[i], arguments[i + 1]);
  }

  return element;
}

function absoluteUrl(url) {
  return createHtmlElement('a', 'href', url).href;
}

function setDocument(newDocument) {
  // The new document can declare a <base href="xxx"> so we ask for absolute urls before updating the document
  var scriptsToInclude = [
    absoluteUrl('/unifiedinbox/js/helpers/load-images-async.js'),
    absoluteUrl('/components/iframe-resizer/js/iframeResizer.contentWindow.js')
  ];
  var cssToInclude = [
    absoluteUrl('/unifiedinbox/css/static/iframe.css')
  ];

  document.documentElement.innerHTML = newDocument;
  document.head.appendChild(createHtmlElement('base', 'target', '_blank'));

  document.head.appendChild(createHtmlElement('script', 'src', scriptsToInclude[0]));// This one must come first, see the script for details
  setTimeout(function() {
    document.head.appendChild(createHtmlElement('script', 'src', scriptsToInclude[1]));//timeout to assure that load-images-async loads first
  }, 10);

  cssToInclude.forEach(function(link) {
    document.head.appendChild(createHtmlElement('link', 'rel', 'stylesheet', 'href', link));
  });

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
      elements = document.querySelectorAll('img[data-inline-image="' + cid + '"]');

  if (elements) {
    Array.prototype.forEach.call(elements, function(element) {
      element.onload = function() {
        window.parentIFrame.size();
      };

      if (url) {
        element.src = url;
      } else {
        element.src = 'Broken_Link';
      }
    });
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
