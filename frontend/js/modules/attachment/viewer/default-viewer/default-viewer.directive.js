(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentDefaultViewer', esnAttachmentDefaultViewer);

  function esnAttachmentDefaultViewer(esnAttachmentViewerService) {
    return {
      restrict: 'E',
      scope: {
        attachment: '=',
        viewer: '='
      },
      link: link,
      templateUrl: '/views/modules/attachment/viewer/default-viewer/default-viewer.html'
    };

    function link(scope, elem) {
      scope.viewer.fitSizeContent(esnAttachmentViewerService.resizeViewer, elem.find('.esn-attachment-default-viewer'));
    }
  }
})();
