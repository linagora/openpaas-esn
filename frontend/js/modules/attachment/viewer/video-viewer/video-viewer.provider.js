'use strict';

angular.module('esn.attachment')

  .provider('attachmentVideoViewerProvider', function() {
    function VideoViewer(name) {
      this.name = name;
      this.contentType = ['video/mp4', 'video/webm', 'video/ogg'];
    };

    function getVideoViewer() {
      return new VideoViewer("video");
    }

    return {
      getVideoViewer: getVideoViewer,
      $get: _.constant(getVideoViewer)
    }
  });