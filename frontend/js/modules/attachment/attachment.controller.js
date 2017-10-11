(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentController', ESNAttachmentController);

  function ESNAttachmentController($log, esnAttachmentViewerService, esnAttachmentViewerGalleryService, esnAttachmentRegistryService) {
    var self = this;
    var hasPreview;
    var hasViewer;

    self.$onInit = $onInit;
    self.onClick = onClick;
    self.$onDestroy = $onDestroy;

    function $onInit() {
      hasPreview = self.preview !== false;
      hasViewer = self.viewer !== false;
      self._attachment = {
        url: '/api/files/' + self.attachment._id,
        name: self.attachment.name,
        contentType: self.attachment.contentType,
        length: self.attachment.length
      };

      if (hasViewer) {
        esnAttachmentViewerGalleryService.addFileToGallery(self._attachment, self.gallery);
      }

      renderContent();
    }

    function openFile(file, gallery) {
      var defaultGallery = esnAttachmentViewerGalleryService.getDefaultGallery();
      var galleryName = gallery || defaultGallery;
      var files = esnAttachmentViewerGalleryService.getAllFilesInGallery(galleryName);
      var order = files.indexOf(file);

      if (order === -1) {
        return $log.debug('No such file in gallery');
      }

      esnAttachmentViewerService.setCurrentItem(files, order);
    }

    function onClick() {
      if (hasViewer) {
        self.viewToggle = true;
        openFile(self._attachment, self.gallery);
      }
    }

    function $onDestroy() {
      if (hasViewer) {
        esnAttachmentViewerGalleryService.removeFileFromGallery(self._attachment, self.gallery);
      }
    }

    function renderContent() {
      if (!self.attachment) {
        return $log.debug('File does not exist or incomplete');
      }

      self.previewer = esnAttachmentRegistryService.getPreviewer(self._attachment.contentType);

      if (!self.previewer || !hasPreview) {
        self.previewer = esnAttachmentRegistryService.getDefaultPreviewer();
      }
    }
  }
})();
