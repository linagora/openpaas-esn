(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService($compile, $window, $rootScope, $timeout, $log, esnAttachmentViewerGalleryService) {

    var currentItem = {};
    var viewer = null;

    return {
      open: open,
      registerViewer: registerViewer,
      resizeViewer: resizeViewer,
      unregisterViewer: unregisterViewer,
      setCurrentItem: setCurrentItem
    };

    function setCurrentItem(files, order) {
      currentItem.files = files;
      currentItem.order = order;
    }

    function open(file, gallery) {
      var defaultGallery = esnAttachmentViewerGalleryService.getDefaultGallery();
      var galleryName = gallery || defaultGallery;
      var files = esnAttachmentViewerGalleryService.getAllFilesInGallery(galleryName);
      var order = files.indexOf(file);

      if (order === -1) {
        return $log.debug('No such file in gallery');
      }

      setCurrentItem(files, order);
      angular.element('body').append(renderDirective('esn-attachment-viewer'));
    }

    function renderDirective(directive, $scope) {
      var elem = angular.element('<' + directive + '></' + directive + '>');
      var scope = $scope || $rootScope.$new();
      var template = $compile(elem)(scope);

      return template;
    }

    function registerViewer(_viewer) {
      viewer = _viewer;
      viewer.open(currentItem.files, currentItem.order);
    }

    function resizeViewer(sizeOptions, item) {
      var newSize = calculateSize(sizeOptions);

      if (item) {
        item.width(newSize.width);
        item.height(newSize.height);
      }
      if (viewer) {
        viewer.display(newSize);
      }
    }

    function calculateSize(sizeOptions) {
      var desiredSize = {};
      var windowWidth = angular.element($window).width();
      var windowHeight = angular.element($window).height();

      if (sizeOptions.desiredRatio) {
        calculateSizeByDesire();
      } else if (sizeOptions.realSize) {
        calculateSizeByReal();
      }

      function calculateSizeByDesire() {
        var ratioWindow = sizeOptions.desiredRatio.desiredRatioWindow;

        if ((windowWidth / windowHeight) > sizeOptions.desiredRatio.desiredRatioSize) {
          desiredSize.height = windowHeight * ratioWindow;
          desiredSize.width = parseInt(desiredSize.height * sizeOptions.desiredRatio.desiredRatioSize, 10);
        } else {
          desiredSize.width = windowWidth * ratioWindow;
          desiredSize.height = parseInt(desiredSize.width / sizeOptions.desiredRatio.desiredRatioSize, 10);
        }
      }

      function calculateSizeByReal() {
        var maxWidth = windowWidth - 100;
        var maxHeight = windowHeight - 140;
        var realWidth = sizeOptions.realSize.width;
        var realHeight = sizeOptions.realSize.height;

        if ((realWidth > maxWidth) || (realHeight > maxHeight)) {
          if ((realWidth / maxWidth) > (realHeight / maxHeight)) {
            desiredSize.width = maxWidth;
            desiredSize.height = parseInt(realHeight / (realWidth / desiredSize.width), 10);
          } else {
            desiredSize.height = maxHeight;
            desiredSize.width = parseInt(realWidth / (realHeight / desiredSize.height), 10);
          }
        } else {
          desiredSize = sizeOptions.realSize;
        }
      }
      return desiredSize;
    }

    function unregisterViewer() {
      currentItem = {};
      viewer = null;
    }
  }

})();
