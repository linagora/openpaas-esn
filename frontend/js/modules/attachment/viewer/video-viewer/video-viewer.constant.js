(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_VIDEO_VIEWER', {
      name: 'videoViewer',
      template: '/views/modules/attachment/templates/video-viewer.html',
      contentType: ['video/mp4', 'video/webm', 'video/ogg']
    });
})();
