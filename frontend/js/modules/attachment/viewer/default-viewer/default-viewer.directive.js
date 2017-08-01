(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnDefaultViewer', esnDefaultViewer);

  function esnDefaultViewer(esnAttachmentViewerService, $http, FileSaver, Blob) {
    return {
      restrict: 'E',
      link: link,
      templateUrl: '/views/modules/attachment/viewer/default-viewer/default-viewer.html'
    };

    function link(scope, elem) {
      scope.provider.fitSizeContent.call(
        scope.provider,
        esnAttachmentViewerService.onResize
      );
    }
  }

})();
