'use strict';

angular.module('esn.attachment')

  .factory('esnAttachmentVideoViewerService', function() {

    var videoViewer = {
      name: 'video',
      contentType: ['video/mp4', 'video/webm', 'video/ogg'],
      fitSizeContent: function($videoContainer, fittingSize, resizeContainer) {
        var size = fittingSize($videoContainer.width(), $videoContainer.height(), 'video');
        $videoContainer.width(size.width);
        $videoContainer.height(size.height);
        resizeContainer(size.width, size.height);
      }
    };

    return {
      videoViewer: videoViewer
    };
  });