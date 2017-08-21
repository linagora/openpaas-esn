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
      buildRegistry: buildRegistry,
      openCurrent: openCurrent,
      openNext: openNext,
      openPrev: openPrev,
      resizeViewer: resizeViewer,
      destroy: destroy
    };

    function getCurrentItem() {
      return currentItem;
    }

    function buildRegistry(viewerRegistry) {
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

    function openCurrent(file, gallery) {
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

    function resizeViewer(sizeOptions, item) {
      var newSize = esnAttachmentViewerViewService.calculateSize(sizeOptions);

      if (item) {
        item.width(newSize.width);
        item.height(newSize.height);
      }
      esnAttachmentViewerViewService.resizeElements(newSize);
    }

    function destroy(file, gallery) {
      esnAttachmentViewerGalleryService.removeFileFromGallery(file, gallery);
      esnAttachmentViewerViewService.removeSelf();
      init = true;
    }
  }

})();
