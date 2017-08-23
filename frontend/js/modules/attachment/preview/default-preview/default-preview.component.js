(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnAttachmentDefaultPreview', {
      bindings: {
        attachment: '='
      },
      templateUrl: '/views/modules/attachment/preview/default-preview/default-preview.html'
    });

})();
