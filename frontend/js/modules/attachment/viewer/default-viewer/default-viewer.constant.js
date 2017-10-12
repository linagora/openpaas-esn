(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_DEFAULT_VIEWER', {
      name: 'defaultViewer',
      directive: 'esn-attachment-default-viewer'
    });
})();
