(function() {
  'use strict';

  angular.module('esn.attachment')
    .run(function(esnAttachmentRegistryService, ESN_ATTACHMENT_VIDEO_VIEWER) {
      var videoViewer = ESN_ATTACHMENT_VIDEO_VIEWER;

      videoViewer.fitSizeContent = fitSizeContent;
      esnAttachmentRegistryService.addViewer(videoViewer);

      function fitSizeContent(resizeViewer, videoContainer) {
        resizeViewer(videoViewer.sizeOptions, videoContainer);
      }
    });

})();
