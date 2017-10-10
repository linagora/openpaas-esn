(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_IMAGE_PREVIEW', {
      name: 'imagePreview',
      template: '/views/modules/attachment/templates/image-preview.html',
      contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
    });
})();
