'use strict';

 angular.module('esn.attachment')
 .run(function(esnAttachmentViewerRegistryService, esnAttachmentViewerService, esnAttachmentDefaultViewerService, esnAttachmentImageViewerService, esnAttachmentVideoViewerService) {
    var defaultViewer = esnAttachmentDefaultViewerService.defaultViewer;
    var imageViewer = esnAttachmentImageViewerService.imageViewer;
    var videoViewer = esnAttachmentVideoViewerService.videoViewer;
    esnAttachmentViewerRegistryService.addFileViewerProvider(defaultViewer);
    esnAttachmentViewerRegistryService.addFileViewerProvider(imageViewer);
    esnAttachmentViewerRegistryService.addFileViewerProvider(videoViewer);
    esnAttachmentViewerService.renderModal();
  });
