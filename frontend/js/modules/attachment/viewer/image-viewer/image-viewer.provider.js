'use strict';

angular.module('esn.attachment')

  .provider('attachmentImageViewerProvider', function() {
    function ImageViewer(name) {
      this.name = name;
      this.contentType = ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif'];
    };

    function getImageViewer() {
      return new ImageViewer("image");
    }

    return {
      getImageViewer: getImageViewer,
      $get: _.constant(getImageViewer)
    }
  });