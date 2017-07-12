'use strict';

angular.
	module('esn.attachment').
	directive('esnVideoViewer', function() {
	  return {
	    scope: {
	      file: '='
	    },
	    restrict: 'E',
	    controller: function($scope,$sce) {
				var videoUrl = function (videoId) {
  				return '/api/files/' + videoId;
				};
				$scope.config = {
          preload: "none",
          sources: [
            { src: $sce.trustAsResourceUrl(videoUrl($scope.file._id)), type: $scope.file.contentType }
          ],
          theme: {
               url: "/components/videogular-themes-default/videogular.css"
            }
          };
			},
	    templateUrl: '/views/modules/attachment/viewer/video-viewer/video-viewer.html'
	  };
});
