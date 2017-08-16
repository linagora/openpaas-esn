(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnImagePreview', esnImagePreview);

  function esnImagePreview() {
    return {
      restrict: 'E',
      scope: {
        attachment: '=',
        gallery: '='
      },
      templateUrl: '/views/modules/attachment/preview/image-preview/image-preview.html'
    };
  }

})();
