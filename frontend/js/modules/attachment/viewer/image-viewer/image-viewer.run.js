(function() {
  'use strict';

  angular.module('esn.attachment')
    .run(function(esnAttachmentRegistryService, esnAttachmentImageViewer) {
      esnAttachmentRegistryService.addViewer(esnAttachmentImageViewer);
    });
})();
