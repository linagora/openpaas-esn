(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentImageViewer', esnAttachmentImageViewer);

  function esnAttachmentImageViewer() {
    return {
      restrict: 'E',
      scope: {
        attachment: '=',
        viewer: '='
      },
      templateUrl: '/views/modules/attachment/viewer/image-viewer/image-viewer.html'
    };
  }
})();
