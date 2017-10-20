(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_VIDEO_VIEWER', {
      name: 'videoViewer',
      directive: 'esn-attachment-video-viewer',
      contentType: ['video/mp4', 'video/webm', 'video/ogg']
    });
})();
