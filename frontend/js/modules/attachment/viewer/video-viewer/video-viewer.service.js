(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentVideoViewerService', esnAttachmentVideoViewerService);

  function esnAttachmentVideoViewerService() {
    var videoViewer = {
      name: 'videoViewer',
      directive: 'video',
      contentType: ['video/mp4', 'video/webm', 'video/ogg'],
      fitSizeContent: fitSizeContent,
      size: {
        realSize: false,
        desiredRatio: {
          defaultRatioWindow: 0.8,
          defaultRatioWH: 2
        }
      }
    };

    function fitSizeContent(onResize, videoContainer) {
      onResize(this.size, videoContainer);
    }

    return {
      viewer: videoViewer
    };

  }

})();
