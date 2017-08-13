'use strict';

angular.module('esn.attachment')
  .run(function(esnAttachmentViewerService, ESN_ATTACHMENT_VIEWERS) {
    var imageViewer = ESN_ATTACHMENT_VIEWERS.imageViewer;
    imageViewer.fitSizeContent = fitSizeContent;
    esnAttachmentViewerService.onBuildRegistry(imageViewer);

    function fitSizeContent(onResize, image) {
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
        onResize(self.sizeOptions, image);
      };
      img.src = image.src;
    }
  });
