'use strict';

function AsyncImageLoader() {
  this.nbLoaded = 0;
  this.nodes = window.document.querySelectorAll('img[data-async-src]');
}

AsyncImageLoader.prototype.load = function() {
  for (var i = 0; i < this.nodes.length; i++) {
    var node = this.nodes.item(i);

    node.onload = this.onLoad.bind(this);
    node.src = node.getAttribute('data-async-src');
  }
};

AsyncImageLoader.prototype.onLoad = function() {
  if (++this.nbLoaded === this.nodes.length) {
    window.parentIFrame.size();
  }
};

/**
 * Keep this here, this is to guarantee that images get loaded _after_ the iFrame is ready,
 * to ensure we can call `window.parentIFrame.size()` when we're done loading images.
 *
 * @see https://github.com/davidjbradshaw/iframe-resizer#readycallback
 */
window.iFrameResizer = {
  readyCallback: function() {
    new AsyncImageLoader().load();
  }
};
