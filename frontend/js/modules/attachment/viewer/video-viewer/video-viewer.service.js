(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentVideoViewerService', esnAttachmentVideoViewerService);

  function esnAttachmentVideoViewerService() {
    var videoViewer = {
      name: 'video',
      contentType: ['video/mp4', 'video/webm', 'video/ogg'],
      fitSizeContent: fitSizeContent,
      pauseOnHide: pauseOnHide
    };

    function fitSizeContent(videoContainer, fittingSize, resizeElements) {
      var defaultRatioWindow = 0.8;
      var defaultRatioWH = 2.2;
      var defaultSize = {
        defaultRatioWindow: defaultRatioWindow,
        defaultRatioWH: defaultRatioWH
      };
      var size = fittingSize(false, false, defaultSize);
      videoContainer.width(size.width);
      videoContainer.height(size.height);
      resizeElements(size.width, size.height);
    }

    function pauseOnHide(video, isHidden) {
      if (isHidden()) {
        video.pause();
      }
    }

    return {
      videoViewer: videoViewer
    };
  }

})();
