'use strict';

angular.module('esn.attachment')
  .run(function(esnAttachmentViewerService, ESN_ATTACHMENT_VIEWERS) {
    var defaultViewer = ESN_ATTACHMENT_VIEWERS.defaultViewer;
    defaultViewer.fitSizeContent = fitSizeContent;
    esnAttachmentViewerService.buildRegistry(defaultViewer);

    function fitSizeContent(resizeViewer) {
      resizeViewer(defaultViewer.sizeOptions);
    }
  });
