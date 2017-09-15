(function() {
  'use strict';

  angular.module('esn.attachment')
    .run(function(esnAttachmentRegistryService, ESN_ATTACHMENT_VIDEO_VIEWER) {
      ESN_ATTACHMENT_VIDEO_VIEWER.fitSizeContent = fitSizeContent;
      esnAttachmentRegistryService.addViewer(ESN_ATTACHMENT_VIDEO_VIEWER);

      function fitSizeContent(resizeViewer, videoContainer) {
        resizeViewer(ESN_ATTACHMENT_VIDEO_VIEWER.sizeOptions, videoContainer);
      }
    });
})();
