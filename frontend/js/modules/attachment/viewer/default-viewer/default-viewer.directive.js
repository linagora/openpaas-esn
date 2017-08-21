(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnDefaultViewer', esnDefaultViewer);

  function esnDefaultViewer(esnAttachmentViewerService) {
    return {
      restrict: 'E',
      link: link,
      templateUrl: '/views/modules/attachment/viewer/default-viewer/default-viewer.html'
    };

    function link(scope) {
      scope.provider.fitSizeContent(esnAttachmentViewerService.resizeViewer);
    }
  }

})();
