(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentController', ESNAttachmentController);

  function ESNAttachmentController(esnAttachmentViewerService, esnAttachmentViewerGalleryService) {
    var self = this;
    var gallery = esnAttachmentViewerService.getFileType(this.attachment.contentType);
    this.attachment.url = esnAttachmentViewerService.getFileUrl(this.attachment._id);
    esnAttachmentViewerGalleryService.addFileToGallery(this.attachment, gallery);
    this.openViewer = function() {
      esnAttachmentViewerService.openViewer(this.attachment, gallery);
    };

    self.$onDestroy = $onDestroy;

    function $onDestroy() {
      esnAttachmentViewerGalleryService.removeFileFromGallery(this.attachment, gallery);
    }
  }

})();
