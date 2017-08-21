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
      scope.display = false;
      scope.displayMain = false;
      scope.displayNav = false;
      scope.file = {};
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
          scope.displayMain = true;
        } else if (newValue === ESN_AV_VIEW_STATES.CLOSE) {
          scope.display = false;
        }
      });

      function open() {
        var currentItem = esnAttachmentViewerService.getCurrentItem();
        var order = currentItem.order + 1;
        scope.display = true;
        scope.displayMain = false;
        scope.file = currentItem.files[currentItem.order];
        scope.number = order + '/' + currentItem.files.length;
        if (currentItem.files.length === 1) {
          scope.displayNav = false;
        } else {
          scope.displayNav = true;
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
