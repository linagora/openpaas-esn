(function() {
  'use strict';

  angular.module('esn.attachment')
    .run(function(esnAttachmentRegistryService, ESN_ATTACHMENT_IMAGE_PREVIEW) {
      esnAttachmentRegistryService.addPreviewer(ESN_ATTACHMENT_IMAGE_PREVIEW);
    });
})();
