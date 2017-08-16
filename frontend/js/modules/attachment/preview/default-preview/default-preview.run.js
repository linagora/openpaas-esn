'use strict';

angular.module('esn.attachment')
  .run(function(esnAttachmentPreviewRegistryService, ESN_ATTACHMENT_PREVIEWS) {
    var defaultPreview = ESN_ATTACHMENT_PREVIEWS.defaultPreview;
    esnAttachmentPreviewRegistryService.addFilePreviewProvider(defaultPreview);
  });
