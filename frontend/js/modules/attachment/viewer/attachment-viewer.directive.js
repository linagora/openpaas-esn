(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentViewer', esnAttachmentViewer);

  function esnAttachmentViewer(esnAttachmentViewerService, ESN_AV_VIEW_STATES) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/attachment/viewer/attachment-viewer.html',
      link: link
    };

    function link(scope, element) {
      scope.animationView = true;
      scope.$onInit = onInit;
      scope.close = closeViewer;
      scope.openPrev = openPrev;
      scope.openNext = openNext;
      scope.download = downloadFile;

      scope.$watch(function() {
        return esnAttachmentViewerService.getCurrentState();
      }, function(newValue) {
        if (newValue === ESN_AV_VIEW_STATES.OPEN_STATE) {
          scope.animationView = true;
        } else if (newValue === ESN_AV_VIEW_STATES.CLOSE_STATE) {
          scope.animationView = false;
        }
      });

      function onInit() {
        esnAttachmentViewerService.onBuildViewer(element);
      }

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
