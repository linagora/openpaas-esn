(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnAttachmentImagePreview', {
      bindings: {
        attachment: '='
      },
      templateUrl: '/views/modules/attachment/preview/image-preview/image-preview.html'
    });

})();
