(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnDefaultPreview', esnDefaultPreview());

  function esnDefaultPreview() {
    return {
      bindings: {
        attachment: '='
      },
      templateUrl: '/views/modules/attachment/preview/default-preview/default-preview.html'
    };
  }

})();
