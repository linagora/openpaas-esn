(function() {
  'use strict';

  angular.module('esn.attachment')
    .run(function(esnAttachmentRegistryService, ESN_ATTACHMENT_IMAGE_VIEWER) {
      ESN_ATTACHMENT_IMAGE_VIEWER.fitSizeContent = fitSizeContent;
      esnAttachmentRegistryService.addViewer(ESN_ATTACHMENT_IMAGE_VIEWER);

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

          angular.extend(ESN_ATTACHMENT_IMAGE_VIEWER.sizeOptions, sizeOptions);
          resizeViewer(self.sizeOptions, image);
        };
        img.src = url;
      }
    });
})();
