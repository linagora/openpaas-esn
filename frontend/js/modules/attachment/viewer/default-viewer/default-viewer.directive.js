(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentDefaultViewer', esnAttachmentDefaultViewer);

  function esnAttachmentDefaultViewer() {
    return {
      restrict: 'E',
      scope: {
        attachment: '=',
        viewer: '='
      },
      templateUrl: '/views/modules/attachment/viewer/default-viewer/default-viewer.html'
    };

  }
})();
