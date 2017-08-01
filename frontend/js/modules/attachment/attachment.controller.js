(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentController', ESNAttachmentController);

  function ESNAttachmentController(esnAttachmentViewerService) {
    var self = this;
    var gallery = getFileType(this.attachment.contentType);

    self.$onInit = $onInit;
    self.openViewer = openViewer;
    self.$onDestroy = $onDestroy;

    function $onInit() {
      esnAttachmentViewerService.onStart(self.attachment, gallery);
    }

    function openViewer() {
      esnAttachmentViewerService.onOpen(self.attachment, gallery);
    }

    function $onDestroy() {
      esnAttachmentViewerService.onDestroy(self.attachment, gallery);
    }

    function getFileType(contentType) {
      if (contentType.indexOf('image') > -1) {
        return 'image';
      } else if (contentType.indexOf('video') > -1) {
        return 'video';
      } else {
        return 'other';
      }
    }
  }

})();
