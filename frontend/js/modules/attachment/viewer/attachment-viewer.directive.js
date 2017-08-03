(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentViewer', esnAttachmentViewer);

  function esnAttachmentViewer(esnAttachmentViewerService) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/attachment/viewer/attachment-viewer.html',
      link: link
    };

    function link(scope, element) {
      esnAttachmentViewerService.onBuildViewer(element);
      scope.close = closeViewer;
      scope.openPrev = openPrev;
      scope.openNext = openNext;
      scope.download = downloadFile;

      function closeViewer(event) {
        esnAttachmentViewerService.onClose(event);
      }

      function openPrev() {
        esnAttachmentViewerService.openPrev();
      }

      function openNext() {
        esnAttachmentViewerService.openNext();
      }

      function downloadFile() {
        esnAttachmentViewerService.downloadFile();
      }
    }
  }

})();
