(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentDefaultViewerService', esnAttachmentDefaultViewerService);

  function esnAttachmentDefaultViewerService() {

    var defaultViewer = {
      name: 'defaultViewer',
      directive: 'default',
      contentType: 'default',
      fitSizeContent: fitSizeContent,
      size: {
        realSize: false,
        desiredRatio: {
          defaultRatioWindow: 0.3,
          defaultRatioWH: 2.8
        }
      }
    };

    function fitSizeContent(onResize) {
      onResize(this.size);
    }

    return {
      viewer: defaultViewer
    };

  }

})();
