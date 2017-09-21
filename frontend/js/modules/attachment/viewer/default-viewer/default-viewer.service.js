(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentDefaultViewer', esnAttachmentDefaultViewer);

    function esnAttachmentDefaultViewer() {
      var defaultViewer = {
        name: 'defaultViewer',
        directive: 'esn-attachment-default-viewer',
        sizeOptions: {
          realSize: false,
          desiredRatio: {
            desiredRatioWindow: 0.27,
            desiredRatioSize: 2.9
          }
        },
        fitSizeContent: fitSizeContent
      };

      function fitSizeContent(resizeViewer, attachmentDefaultViewer) {
        resizeViewer(defaultViewer.sizeOptions, attachmentDefaultViewer);
      }

      return defaultViewer;
    }
})();
