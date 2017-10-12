(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_IMAGE_VIEWER', {
      name: 'imageViewer',
      directive: 'esn-attachment-image-viewer',
      contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
    });
})();
