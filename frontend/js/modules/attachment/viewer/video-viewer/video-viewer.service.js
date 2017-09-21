(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentVideoViewer', esnAttachmentVideoViewer);

    function esnAttachmentVideoViewer() {
      var videoViewer = {
        name: 'videoViewer',
        directive: 'esn-attachment-video-viewer',
        contentType: ['video/mp4', 'video/webm', 'video/ogg'],
        sizeOptions: {
          realSize: false,
          desiredRatio: {
            desiredRatioWindow: 0.8,
            desiredRatioSize: 2
          }
        },
        fitSizeContent: fitSizeContent
      };

      function fitSizeContent(resizeViewer, videoContainer) {
        resizeViewer(videoViewer.sizeOptions, videoContainer);
      }

      return videoViewer;
    }
})();