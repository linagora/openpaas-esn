(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentViewerService', esnAttachmentViewerService);

  function esnAttachmentViewerService($log, $rootScope, $compile, esnAttachmentViewerGalleryService) {
    var currentItem = {};
    var viewer = null;

    return {
      open: open,
      registerViewer: registerViewer,
      setCurrentItem: setCurrentItem
    };

    function open(file, gallery) {
      var defaultGallery = esnAttachmentViewerGalleryService.getDefaultGallery();
      var galleryName = gallery || defaultGallery;
      var files = esnAttachmentViewerGalleryService.getAllFilesInGallery(galleryName);
      var order = files.indexOf(file);

      if (order === -1) {
        return $log.debug('No such file in gallery');
      }

      setCurrentItem(files, order);
      angular.element('body').append($compile('<esn-attachment-viewer/>')($rootScope.$new()));
    }

    function setCurrentItem(files, order) {
      currentItem.files = files;
      currentItem.order = order;
    }

    function registerViewer(_viewer) {
      viewer = _viewer;
      viewer.open(currentItem.files, currentItem.order);
    }
  }
})();
