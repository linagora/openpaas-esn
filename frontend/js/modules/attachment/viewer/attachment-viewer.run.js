'use strict';

 angular.module('esn.attachment')
 .run(function(attachmentViewerService, attachmentDefaultViewerService, attachmentImageViewerService, attachmentVideoViewerService) {
    var defaultViewer = attachmentDefaultViewerService.defaultViewer;
    var imageViewer = attachmentImageViewerService.imageViewer;
    var videoViewer = attachmentVideoViewerService.videoViewer;
    attachmentViewerService.addFileViewerProvider(defaultViewer);
    attachmentViewerService.addFileViewerProvider(imageViewer);
    attachmentViewerService.addFileViewerProvider(videoViewer);
    attachmentViewerService.renderPopup();
  });
 