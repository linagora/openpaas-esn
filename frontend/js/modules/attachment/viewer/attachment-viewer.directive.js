(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentViewer', esnAttachmentViewer);

  function esnAttachmentViewer($rootScope, $window, $compile, $timeout, esnAttachmentRegistryService, esnAttachmentViewerService, ESN_ATTACHMENT_DEFAULT) {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/attachment/viewer/attachment-viewer.html',
      link: link
    };

    function link(scope, element) {
      var currentItem;

      scope.display = false;
      scope.displayMain = false;
      scope.displayNav = false;
      scope.numberInGallery = '';

      scope.onInit = onInit;
      scope.close = closeViewer;
      scope.openPrev = openPrev;
      scope.openNext = openNext;

      function onInit() {
        var viewer = {
          open: open,
          display: display
        };

        esnAttachmentViewerService.registerViewer(viewer);
      }

      function open(files, order) {
        var currentOrder = order + 1;

        currentItem = {files: files, order: order};
        scope.display = true;
        scope.displayMain = false;
        scope.attachment = files[order];
        scope.numberInGallery = currentOrder + '/' + files.length;
        scope.displayNav = files.length > 1;

        renderContent();
      }

      function renderContent() {
        var elem, template, newElt;
        var viewer = esnAttachmentRegistryService.getViewer(scope.attachment.contentType);

        scope.viewer = viewer || esnAttachmentRegistryService.getViewer(ESN_ATTACHMENT_DEFAULT.viewer);

        elem = angular.element('<' + scope.viewer.directive + '></' + scope.viewer.directive + '>');
        elem.attr({ attachment: 'attachment', viewer: 'viewer' });
        template = angular.element(elem);
        newElt = $compile(template)(scope);

        element.find('.av-main').html(newElt);
      }

      function display(desiredSize) {
        element.find('.av-topBar').css({
          width: desiredSize.width + 'px'
        });

        $timeout(function() {
          scope.displayMain = true;
        });
      }

      function openNext() {
        var next;

        if (currentItem.order === currentItem.files.length - 1) {
          next = 0;
        } else {
          next = currentItem.order + 1;
        }
        open(currentItem.files, next);
      }

      function openPrev() {
        var prev;

        if (currentItem.order === 0) {
          prev = currentItem.files.length - 1;
        } else {
          prev = currentItem.order - 1;
        }

        open(currentItem.files, prev);
      }

      function closeViewer(event) {
        if (event.target.className.indexOf('av-outerContainer') > -1 || (event.target.className.indexOf('av-closeButton') > -1)) {
          $timeout(function() {
            element.remove();
          }, 200);
          scope.display = false;
        }
      }

    }
  }

})();
