(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentViewer', esnAttachmentViewer);

  function esnAttachmentViewer(esnAttachmentViewerService, esnAttachmentViewerViewService, ESN_AV_VIEW_STATES) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/attachment/viewer/attachment-viewer.html',
      link: link
    };

    function link(scope, element) {
      scope.view = false;
      scope.main = false;
      scope.nav = false;
      scope.fileName = '';
      scope.number = '';

      scope.onInit = onInit;
      scope.close = closeViewer;
      scope.openPrev = openPrev;
      scope.openNext = openNext;

      scope.$watch(function() {
        return esnAttachmentViewerViewService.getState();
      }, function(newValue) {
        if (newValue === ESN_AV_VIEW_STATES.OPEN) {
          open();
        } else if (newValue === ESN_AV_VIEW_STATES.DISPLAY) {
          scope.main = true;
        } else if (newValue === ESN_AV_VIEW_STATES.CLOSE) {
          scope.view = false;
        }
      });

      function open() {
        var currentItem = esnAttachmentViewerService.getCurrentItem();
        var order = currentItem.order + 1;
        scope.view = true;
        scope.main = false;
        scope.file = currentItem.files[currentItem.order];
        scope.number = order + '/' + currentItem.files.length;
        if (currentItem.files.length === 1) {
          scope.nav = false;
        } else {
          scope.nav = true;
        }
      }

      function onInit() {
        esnAttachmentViewerViewService.buildViewer(element);
      }

      function closeViewer(event) {
        esnAttachmentViewerViewService.closeViewer(event);
      }

      function openPrev() {
        esnAttachmentViewerService.openPrev();
      }

      function openNext() {
        esnAttachmentViewerService.openNext();
      }
    }
  }

})();
