(function() {
  'use strict';

  angular.module('esn.attachment')
    .run(function(esnAttachmentRegistryService, ESN_ATTACHMENT_DEFAULT_VIEWER) {
      var defaultViewer = ESN_ATTACHMENT_DEFAULT_VIEWER;

      defaultViewer.fitSizeContent = fitSizeContent;
      esnAttachmentRegistryService.addViewer(defaultViewer);

      function fitSizeContent(resizeViewer, attachmentDefaultViewer) {
        resizeViewer(defaultViewer.sizeOptions, attachmentDefaultViewer);
      }
    });

})();
