(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService(esnAttachmentViewerRegistryService, esnAttachmentViewerGalleryService, esnAttachmentViewerViewService, FileSaver, $http, $log) {

    var viewerServiceDefinition = ['name', 'directive', 'contentType', 'sizeOptions', 'fitSizeContent'];

    var galleryService = esnAttachmentViewerGalleryService;
    var viewerRegistryService = esnAttachmentViewerRegistryService;
    var viewerViewService = esnAttachmentViewerViewService;

    var currentItem = {};
    var init = true;

    return {
      onInit: onInit,
      onBuildRegistry: onBuildRegistry,
      onBuildViewer: onBuildViewer,
      onOpen: onOpen,
      openNext: openNext,
      openPrev: openPrev,
      onResize: onResize,
      downloadFile: downloadFile,
      getCurrentState: getCurrentState,
      onClose: onClose,
      onDestroy: onDestroy
    };

    function onInit(file, gallery) {
      if (init) {
        viewerViewService.renderViewer();
        init = false;
      }

      buildGallery(file, gallery);
    }

    function buildGallery(file, gallery) {
      file.url = '/api/files/' + file._id;
      galleryService.addFileToGallery(file, gallery);
    }

    function onBuildRegistry(viewerRegistry) {
      var required = true;

      angular.forEach(viewerServiceDefinition, function(value) {
        if (!viewerRegistry[value]) {
          required = false;
        }
      });
      if (required) {
        viewerRegistryService.addFileViewerProvider(viewerRegistry);
      } else {
        $log.debug('Viewer provider need to be defined properly');
      }
    }

    function onBuildViewer(viewer) {
      viewerViewService.buildViewer(viewer);
    }

    function onOpen(file, gallery) {
      var defaultGallery = galleryService.getDefaultGallery();
      var galleryName = gallery || defaultGallery;
      var files = galleryService.getAllFilesInGallery(galleryName);
      var order = files.indexOf(file);

      openViewer(files, order);
    }

    function openNext() {
      var next;

      if (currentItem.order === currentItem.files.length - 1) {
        next = 0;
      } else {
        next = currentItem.order + 1;
      }
      openViewer(currentItem.files, next);
    }

    function openPrev() {
      var prev;

      if (currentItem.order === 0) {
        prev = currentItem.files.length - 1;
      } else {
        prev = currentItem.order - 1;
      }
      openViewer(currentItem.files, prev);
    }

    function openViewer(files, order) {
      var provider = viewerRegistryService.getProvider(files[order].contentType);
      provider = provider || viewerRegistryService.getProvider('default');

      if (order > -1) {
        currentItem = {
          files: files,
          order: order
        };
        viewerViewService.openViewer(files, order, provider);
      } else {
        $log.debug('No such file in gallery');
      }
    }

    function onResize(sizeOptions, item) {
      var newSize = viewerViewService.calculateSize(sizeOptions);

      if (item) {
        item.width(newSize.width);
        item.height(newSize.height);
      }
      viewerViewService.resizeElements(newSize);
    }

    function downloadFile() {
      var file = currentItem.files[currentItem.order];
      $http({
        method: 'GET',
        url: file.url,
        responseType: 'blob'
      }).then(function successCallback(response) {
        var data = response.data;
        if (!data) {
          $log.debug('No data');
          return;
        }
        FileSaver.saveAs(data, file.name);
      }, function errorCallback() {
        $log.debug('Fail to get file');
      });
    }

    function getCurrentState() {
      return viewerViewService.getState();
    }

    function onClose(event) {
      viewerViewService.closeViewer(event);
    }

    function onDestroy(file, gallery) {
      galleryService.removeFileFromGallery(file, gallery);
      viewerViewService.removeSelf();
      init = true;
    }
  }

})();
