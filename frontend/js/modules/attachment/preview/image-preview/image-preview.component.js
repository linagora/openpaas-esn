(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnImagePreview', esnImagePreview());

  function esnImagePreview() {
    return {
      bindings: {
        attachment: '='
      },
      templateUrl: '/views/modules/attachment/preview/image-preview/image-preview.html'
    };
  }

})();
