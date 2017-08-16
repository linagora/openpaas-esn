'use strict';

angular.module('esn.attachment')
  .run(function(esnAttachmentPreviewRegistryService, ESN_ATTACHMENT_PREVIEWS) {
    var imagePreview = ESN_ATTACHMENT_PREVIEWS.imagePreview;
    esnAttachmentPreviewRegistryService.addFilePreviewProvider(imagePreview);
  });
