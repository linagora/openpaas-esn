(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService(esnAttachmentViewerRegistryService, esnAttachmentViewerGalleryService, esnAttachmentViewerViewService, esnAttachmentDefaultViewerService, esnAttachmentImageViewerService, esnAttachmentVideoViewerService, $http) {

    var viewerServiceDefinition = ['name', 'directive', 'contentType', 'fitSizeContent', 'size'];

    var galleryService = esnAttachmentViewerGalleryService;
    var viewerRegistryService = esnAttachmentViewerRegistryService;
    var viewerViewService = esnAttachmentViewerViewService;

    var currentItem = {};

    return {
      onInit: onInit,
      onBuildRegistry: onBuildRegistry,
      onBuildViewer: onBuildViewer,
      onBuildGallery: onBuildGallery,
      onOpen: onOpen,
      openNext: openNext,
      openPrev: openPrev,
      onResize: onResize,
      downloadFile: downloadFile,
      onClose: onClose,
      onDestroy: onDestroy
    };

    function onInit() {
      viewerViewService.renderViewer();
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
        console.log('Viewer service need to be defined properly');
      }
    }

    function onBuildViewer(viewer) {
      viewerViewService.buildViewer(viewer);
    }

    function onBuildGallery(file, gallery) {
      file.url = '/api/files/' + file._id;
      galleryService.addFileToGallery(file, gallery);
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
      } else {
        console.log('No matched file in this ' + gallery + ' gallery');
      }
    }

    function onResize(size, item) {
      var newsize = viewerViewService.calculateSize(size);
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
          console.error('No data');
          return;
        }
        FileSaver.saveAs(response.data, file.name);
      }, function errorCallback(response) {
        console.log('Fail to get file');
      });
    }

    function onClose(event) {
      viewerViewService.closeViewer(event);
    }

    function onDestroy() {
      viewerViewService.remove();
    }
  }

})();
