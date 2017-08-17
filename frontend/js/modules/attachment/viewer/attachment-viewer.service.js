(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService(esnAttachmentViewerRegistryService, esnAttachmentViewerGalleryService, esnAttachmentViewerViewService, $log) {

    var viewerServiceDefinition = ['name', 'directive', 'contentType', 'sizeOptions', 'fitSizeContent'];

    var currentItem = {};
    var init = true;

    return {
      getCurrentItem: getCurrentItem,
      onBuild: onBuild,
      onBuildRegistry: onBuildRegistry,
      onOpen: onOpen,
      openNext: openNext,
      openPrev: openPrev,
      onResize: onResize,
      onDestroy: onDestroy
    };

    function getCurrentItem() {
      return currentItem;
    }

    function onBuild(file, gallery) {
      if (init) {
        esnAttachmentViewerViewService.renderViewer();
        init = false;
      }
      esnAttachmentViewerGalleryService.addFileToGallery(file, gallery);
    }

    function onBuildRegistry(viewerRegistry) {
      var required = true;

      angular.forEach(viewerServiceDefinition, function(value) {
        if (!viewerRegistry[value]) {
          required = false;
        }
      });
      if (required) {
        esnAttachmentViewerRegistryService.addFileViewerProvider(viewerRegistry);
      } else {
        $log.debug('Viewer provider need to be defined properly');
      }
    }

    function onOpen(file, gallery) {
      var defaultGallery = esnAttachmentViewerGalleryService.getDefaultGallery();
      var galleryName = gallery || defaultGallery;
      var files = esnAttachmentViewerGalleryService.getAllFilesInGallery(galleryName);
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
      var provider = esnAttachmentViewerRegistryService.getProvider(files[order].contentType);
      provider = provider || esnAttachmentViewerRegistryService.getProvider('default');

      if (order > -1) {
        currentItem = {
          files: files,
          order: order
        };
        esnAttachmentViewerViewService.renderContent(files[order], provider);
      } else {
        $log.debug('No such file in gallery');
      }
    }

    function onResize(sizeOptions, item) {
      var newSize = esnAttachmentViewerViewService.calculateSize(sizeOptions);

      if (item) {
        item.width(newSize.width);
        item.height(newSize.height);
      }
      esnAttachmentViewerViewService.resizeElements(newSize);
    }

    function onDestroy(file, gallery) {
      esnAttachmentViewerGalleryService.removeFileFromGallery(file, gallery);
      esnAttachmentViewerViewService.removeSelf();
      init = true;
    }
  }

})();
