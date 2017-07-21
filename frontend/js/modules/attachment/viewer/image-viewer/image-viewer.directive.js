'use strict';

angular.
	module('esn.attachment').
	directive('esnImageViewer', ['attachmentViewerService', function(attachmentViewerService) {
	  return {
      restrict: 'E',
      controller: function($scope) {
        $scope.imageUrl = attachmentViewerService.getFileUrl($scope.file._id);
        
      },
      templateUrl: '/views/modules/attachment/viewer/image-viewer/image-viewer.html'
    };
}]);
