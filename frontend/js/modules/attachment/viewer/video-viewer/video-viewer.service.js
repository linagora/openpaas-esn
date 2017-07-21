'use strict';

angular.module('esn.attachment')

  .factory('attachmentVideoViewerService', function() {

    var videoViewer = {
      name: 'video',
      contentType: ['video/mp4', 'video/webm', 'video/ogg']
    };

    return {
      videoViewer: videoViewer
    };
  });