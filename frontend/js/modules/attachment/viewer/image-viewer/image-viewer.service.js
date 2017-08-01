(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentImageViewerService', esnAttachmentImageViewerService);

  function esnAttachmentImageViewerService($window) {
    var imageViewer = {
      name: 'imageViewer',
      directive: 'image',
      contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif'],
      fitSizeContent: fitSizeContent,
      size: {
        realSize: true,
        desiredRatio: false
      }
    };

    function fitSizeContent(onResize, image) {
      var img = new Image();
      var self = this;
      img.onload = function() {
        var size = {
          realSize: {
            width: img.width,
            height: img.height
          }
        };
        angular.extend(self.size, size);
        onResize(self.size, image);
      }
      img.src = image.src;
    }

    return {
      viewer: imageViewer
    };

  }

})();
