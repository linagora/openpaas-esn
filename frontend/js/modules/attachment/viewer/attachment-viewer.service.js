(function () {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService(esnAttachmentViewerRegistryService, esnAttachmentViewerGalleryService, esnAttachmentViewerViewService, FileSaver, $http) {

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

      angular.forEach(viewerServiceDefinition, function (value) {
        if (!viewerRegistry[value]) {
          required = false;
        }
      });
      if (required) {
        viewerRegistryService.addFileViewerProvider(viewerRegistry);
      }
    }

    function onBuildViewer(viewer) {
      viewerViewService.buildViewer(viewer);
    }

    function onOpen(file, gallery) {
      var defaultGallery = galleryService.getDefaultGallery();
      var galleryName = gallery ? gallery : defaultGallery;
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

      provider = provider ? provider : viewerRegistryService.getProvider('default');
      if (order > -1) {
        currentItem = {
          files: files,
          order: order
        };
        viewerViewService.openViewer(files, order, provider);
      }
    }

    function onResize(sizeOptions, item) {
      var newsize = viewerViewService.calculateSize(sizeOptions);

      if (item) {
        item.width(newsize.width);
        item.height(newsize.height);
      }
      viewerViewService.resizeElements(newsize);
    }

    function downloadFile() {
      var file = currentItem.files[currentItem.order];
      
      $http({
        method: 'GET',
        url: file.url,
        responseType: "blob"
      }).then(function successCallback(response) {
        if (!response.data) {
          // No data
          return;
        }
        FileSaver.saveAs(response.data, file.name);
      }, function errorCallback(response) {
        // Fail to get file
      });
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
