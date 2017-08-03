'use strict';

angular.module('esn.attachment')
  .run(function(esnAttachmentViewerService, esnAttachmentDefaultViewerService) {
    var defaultViewer = esnAttachmentDefaultViewerService.viewer;
    esnAttachmentViewerService.onBuildRegistry(defaultViewer);
  });
