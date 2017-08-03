'use strict';

angular.module('esn.attachment')
  .run(function(esnAttachmentViewerService, esnAttachmentImageViewerService) {
    var imageViewer = esnAttachmentImageViewerService.viewer;
    esnAttachmentViewerService.onBuildRegistry(imageViewer);
  });
