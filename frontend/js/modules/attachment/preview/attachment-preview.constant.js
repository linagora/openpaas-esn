(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_PREVIEWS', {
      defaultPreview: {
        name: 'defaultViewer',
        directive: 'esn-default-preview',
        contentType: 'default'
      },
      imagePreview: {
        name: 'imageViewer',
        directive: 'esn-image-preview',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      }
    });

})();
