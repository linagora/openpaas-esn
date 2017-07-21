(function() {
  'use strict';

  angular.module('esn.attachment', [
    'esn.file',
    'esn.core',
    'esn.registry',
    'ngSanitize',
    'com.2fdevs.videogular',
    'com.2fdevs.videogular.plugins.controls',
    'com.2fdevs.videogular.plugins.overlayplay'
  ]).
  run(function(attachmentViewerService, attachmentDefaultViewerProvider, attachmentImageViewerProvider, attachmentVideoViewerProvider) {
    var defaultViewer = attachmentDefaultViewerProvider();
    var imageViewer = attachmentImageViewerProvider();
    var videoViewer = attachmentVideoViewerProvider();
    attachmentViewerService.addFileViewerProvider(defaultViewer);
    attachmentViewerService.addFileViewerProvider(imageViewer);
    attachmentViewerService.addFileViewerProvider(videoViewer);
    attachmentViewerService.renderPopup();
  });
})();