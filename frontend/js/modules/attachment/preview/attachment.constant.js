(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_PREVIEWS', {
      defaultPreview: {
        name: 'defaultPreivew',
        directive: 'esn-default-preview',
        contentType: 'default'
      },
      imagePreview: {
        name: 'imagePreview',
        directive: 'esn-image-preview',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
      }
    });

})();
