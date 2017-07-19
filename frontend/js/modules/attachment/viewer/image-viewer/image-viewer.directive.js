'use strict';

angular.
	module('esn.attachment').
	directive('esnImageViewer', ['attachmentViewer', function(attachmentViewer) {
	  return {
      restrict: 'A',
      // scope: {
      //   file: '='
      // },
      controller: function($scope, attachmentViewer) {
        //$scope.imageUrl = attachmentViewer.getFileUrl($scope.file._id);
        //console.log($scope.imageUrl);
        // lightbox.option({
        //   'resizeDuration': 200,
        //   'wrapAround': true
        // });
        // lightbox.build("image");
        // lightbox.start($scope.currentTarget);
        
      },
      link: function(scope, element, attrs){
        attachmentViewer.buildLightboxImage(scope.currentTarget, element);
      }
    };
}]);
