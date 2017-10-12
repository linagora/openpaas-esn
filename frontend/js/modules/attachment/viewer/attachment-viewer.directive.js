(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentViewer', esnAttachmentViewer);

  function esnAttachmentViewer($compile, esnAttachmentRegistryService, esnAttachmentViewerService) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/attachment/viewer/attachment-viewer.html',
      link: link
    };

    function link(scope, element) {
      var currentItem;

      scope.displayMain = false;
      scope.displayNav = false;
      scope.numberInGallery = '';

      scope.onInit = onInit;
      scope.close = closeViewer;
      scope.openPrev = openPrev;
      scope.openNext = openNext;

      function onInit() {
        var viewer = {
          open: open
        };

        esnAttachmentViewerService.registerViewer(viewer);
      }

      function open(files, order) {
        currentItem = {files: files, order: order};
        scope.displayNav = files.length > 1;
        getViewer(order);
        renderDirective();
      }

      function getViewer(order) {
        var currentOrder = order + 1;

        scope.attachment = currentItem.files[order];

        var viewer = esnAttachmentRegistryService.getViewer(scope.attachment.contentType);

        currentItem.order = order;
        scope.numberInGallery = 'File ' + currentOrder + ' of ' + currentItem.files.length;
        scope.viewer = viewer || esnAttachmentRegistryService.getDefaultViewer();
      }

      function renderDirective() {
        var newElt = $compile('<' + scope.viewer.directive + ' attachment="attachment", viewer="viewer" />')(scope);
        element.find('.av-attachment-content').html(newElt);
      }

      function openNext() {
        var next;

        if (currentItem.order === currentItem.files.length - 1) {
          next = 0;
        } else {
          next = currentItem.order + 1;
        }
        getViewer(next);
        renderDirective();
      }

      function openPrev() {
        var prev;

        if (currentItem.order === 0) {
          prev = currentItem.files.length - 1;
        } else {
          prev = currentItem.order - 1;
        }
        getViewer(prev);
        renderDirective();
      }

      function closeViewer() {
        element.remove();
      }

    }
  }
})();
