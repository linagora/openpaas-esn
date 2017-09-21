(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentImageViewer', esnAttachmentImageViewer);

    function esnAttachmentImageViewer() {
      var imageViewer = {
        name: 'imageViewer',
        directive: 'esn-attachment-image-viewer',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif'],
        sizeOptions: {
          realSize: true,
          desiredRatio: false
        },
        fitSizeContent: fitSizeContent
      };

      function fitSizeContent(resizeViewer, image, url) {
        var img = new Image();
        var self = this;

        img.onload = function() {
          var sizeOptions = {
            realSize: {
              width: img.width,
              height: img.height
            }
          };

          angular.extend(imageViewer.sizeOptions, sizeOptions);
          resizeViewer(self.sizeOptions, image);
        };
        img.src = url;
      }

      return imageViewer;
    }
})();