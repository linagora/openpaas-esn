(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_IMAGE_VIEWER', {
      name: 'imageViewer',
      template: '/views/modules/attachment/templates/image-viewer.html',
      contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
    });
})();
