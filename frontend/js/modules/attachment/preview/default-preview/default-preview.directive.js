(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnDefaultPreview', esnDefaultPreview);

  function esnDefaultPreview() {
    return {
      restrict: 'E',
      scope: {
        attachment: '=',
        gallery: '='
      },
      templateUrl: '/views/modules/attachment/preview/default-preview/default-preview.html'
    };
  }

})();
