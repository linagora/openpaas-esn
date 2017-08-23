(function() {
  'use strict';

  angular.module('esn.attachment')
    .constant('ESN_ATTACHMENT_DEFAULT_VIEWER', {
      name: 'defaultViewer',
      directive: 'esn-attachment-default-viewer',
      contentType: 'defaultViewer',
      sizeOptions: {
        realSize: false,
        desiredRatio: {
          desiredRatioWindow: 0.27,
          desiredRatioSize: 2.9
        }
      }
    });

})();
