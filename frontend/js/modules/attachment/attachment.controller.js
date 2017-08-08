(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentController', ESNAttachmentController);

  function ESNAttachmentController(esnAttachmentViewerService, contentTypeService) {
    var self = this;
    var gallery = contentTypeService.getType(this.attachment.contentType);

    self.$onInit = $onInit;
    self.openViewer = openViewer;
    self.$onDestroy = $onDestroy;

    function $onInit() {
      esnAttachmentViewerService.onInit(self.attachment, gallery);
    }

    function openViewer() {
      esnAttachmentViewerService.onOpen(self.attachment, gallery);
    }

    function $onDestroy() {
      esnAttachmentViewerService.onDestroy(self.attachment, gallery);
    }
  }

})();
