(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_DEFAULT_PREVIEW', {
      name: 'defaultPreivew',
      directive: 'esn-attachment-default-preview',
      contentType: 'defaultPreviewer'
    });

})();
