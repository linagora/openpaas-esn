(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService(esnAttachmentViewerRegistryService, esnAttachmentViewerGalleryService, esnAttachmentViewerViewService, esnAttachmentDefaultViewerService, esnAttachmentImageViewerService, esnAttachmentVideoViewerService) {

    var viewerServiceDefinition = ['name', 'contentType', 'fitSizeContent', 'size'];

    var availableViewersService = [
      esnAttachmentDefaultViewerService,
      esnAttachmentImageViewerService,
      esnAttachmentVideoViewerService
    ];
    var galleryService = esnAttachmentViewerGalleryService;
    var viewerRegistryService = esnAttachmentViewerRegistryService;
    var viewerViewService = esnAttachmentViewerViewService;

    return {
      onInit: onInit,
      onStart: onStart,
      onOpen: onOpen,
      onResize: onResize,
      onHide: onHide,
      onDestroy: onDestroy
    };

    // build Registry
    function onInit() {
      var required;

      availableViewersService.forEach(function(viewerS) {
        addViewerService(viewerS);
      });

      function addViewerService(viewerS) {
        required = true;
        angular.forEach(viewerServiceDefinition, function(value) {
          if (!viewerS.viewer[value]) {
            required = false;
          }
        });
        if (required) {
          viewerRegistryService.addFileViewerProvider(viewerS.viewer);
        } else {
          console.log('Viewer service need to be defined properly');
        }
      }
    }

    function onStart(file, gallery) {
      viewerViewService.renderModal();
      buildGallery();

      function buildGallery() {
        file.url = '/api/files/' + file._id;
        galleryService.addFileToGallery(file, gallery);
      }
    }

    function onOpen(file, gallery) {
      var files = [];
      var order;
      if (!gallery) {
        gallery = galleryService.defaultGallery;
      }
      files = galleryService.getAllFilesInGallery(gallery);
      order = galleryService.findOrderInArray(files, file);
      if (order > -1) {
        viewerViewService.openViewer(files, order);
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

    function onHide(callback) {
      if (angular.isFunction(callback)) {
        viewerViewService.onHide(callback);
      } else {
        console.log('Must pass a callback function');
      }
    }

    function onDestroy() {
      viewerViewService.remove();
    }
  }

})();
