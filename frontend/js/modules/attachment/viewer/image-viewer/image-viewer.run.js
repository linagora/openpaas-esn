(function() {
  'use strict';

  angular.module('esn.attachment')
    .run(function(esnAttachmentRegistryService, ESN_ATTACHMENT_IMAGE_VIEWER) {
      var imageViewer = ESN_ATTACHMENT_IMAGE_VIEWER;

      imageViewer.fitSizeContent = fitSizeContent;
      esnAttachmentRegistryService.addViewer(imageViewer);

      function fitSizeContent(resizeViewer, image) {
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
        img.src = image.src;
      }
    });

})();
