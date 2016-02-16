'use strict';

function AsyncImageLoader() {
  this.nbLoaded = 0;
  this.nodes = window.document.querySelectorAll('img[data-async-src]');
}

AsyncImageLoader.prototype.load = function() {
  for (var i = 0; i < this.nodes.length; i++) {
    var node = this.nodes.item(i);

    node.onload = this.onLoad.bind(this);
    node.onerror = this.onError.bind(this, node);
    node.src = node.getAttribute('data-async-src');
  }
};

AsyncImageLoader.prototype.onLoad = function() {
  if (++this.nbLoaded === this.nodes.length) {
    window.parentIFrame.size();
  }
};

AsyncImageLoader.prototype.onError = function(image) {
  image.src = '/images/ic_broken_image_black_48px.svg';
  image.width = 48;
  image.height = 48; // Width and height of the "broken image" icon

  return true;
};

new AsyncImageLoader().load();
