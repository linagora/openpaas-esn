'use strict';

angular.module('esn.attachment')
  .run(function(esnAttachmentViewerService, ESN_ATTACHMENT_VIEWERS) {
    var videoViewer = ESN_ATTACHMENT_VIEWERS.videoViewer;
    videoViewer.fitSizeContent = fitSizeContent;
    esnAttachmentViewerService.buildRegistry(videoViewer);

    function fitSizeContent(resizeViewer, videoContainer) {
      resizeViewer(videoViewer.sizeOptions, videoContainer);
    }
  });
