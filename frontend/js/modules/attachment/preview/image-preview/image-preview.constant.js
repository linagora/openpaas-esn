(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_IMAGE_PREVIEW', {
      name: 'imagePreview',
      directive: 'esn-attachment-image-preview',
      contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
    });
})();
