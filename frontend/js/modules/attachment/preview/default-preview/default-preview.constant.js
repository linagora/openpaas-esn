(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_DEFAULT_PREVIEW', {
      name: 'defaultPreview',
      template: '/views/modules/attachment/templates/default-preview.html'
    });
})();
