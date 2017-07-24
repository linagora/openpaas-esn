'use strict';

angular
  .module('esn.attachment')
  .directive('esnImageViewer', ['esnAttachmentViewerService', function(esnAttachmentViewerService) {
    return {
      restrict: 'E',
      link: function($scope, $elem) {
        var $image = angular.element($elem.find('.av-img'));
        $image.src = $scope.file.url;
        $scope.provider.fitSizeContent(
        	$image,
        	esnAttachmentViewerService.fittingSize.bind(esnAttachmentViewerService),
        	esnAttachmentViewerService.resizeContainer.bind(esnAttachmentViewerService)
        	);
      },
      templateUrl: '/views/modules/attachment/viewer/image-viewer/image-viewer.html'
    };
  }]);