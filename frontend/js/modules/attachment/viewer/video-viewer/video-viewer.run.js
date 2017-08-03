'use strict';

angular.module('esn.attachment')
  .run(function(esnAttachmentViewerService, esnAttachmentVideoViewerService) {
    var videoViewer = esnAttachmentVideoViewerService.viewer;
    esnAttachmentViewerService.onBuildRegistry(videoViewer);
  });
