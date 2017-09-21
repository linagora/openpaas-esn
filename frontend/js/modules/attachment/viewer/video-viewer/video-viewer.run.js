(function() {
  'use strict';

  angular.module('esn.attachment')
    .run(function(esnAttachmentRegistryService, esnAttachmentVideoViewer) {
      esnAttachmentRegistryService.addViewer(esnAttachmentVideoViewer);
    });
})();
