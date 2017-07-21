'use strict';

angular
	.module('esn.attachment')
	.directive('esnImageViewer', function(attachmentViewerService) {
	  return {
      restrict: 'E',
      templateUrl: '/views/modules/attachment/viewer/image-viewer/image-viewer.html'
    };
});
