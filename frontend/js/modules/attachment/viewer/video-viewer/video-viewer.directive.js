'use strict';

angular.
module('esn.attachment').
directive('esnVideoViewer', ['attachmentViewerService', function(attachmentViewerService) {
  return {
    // scope: {
    //   file: '='
    // },
    restrict: 'E',
    controller: function($scope, $sce) {
      var videoUrl = attachmentViewerService.getFileUrl($scope.file._id);
      // $scope.API = null;
      // $scope.onPlayerReady = function(API) {
      //   $scope.API = API;          
      // };
      // // $scope.$on('modalOnHidden', function() {
      // //   $scope.API.pause();
      // // });
      // $scope.config = {
      //   preload: "none",
      //   autoHide: true,
      //   autoHideTime: 3000,
      //   sources: [
      //     { src: $sce.trustAsResourceUrl(videoUrl), type: $scope.file.contentType }
      //   ],
      //   theme: {
      //     url: "/components/videogular-themes-default/videogular.css"
      //   }
      // };
      //attachmentViewer.buildLightboxVideo($scope.currentTarget);
    },
    // link: function(scope, element, attrs) {
    //   var video = element.find('video');
    //   console.log(scope.video);
      
    // },
    templateUrl: '/views/modules/attachment/viewer/video-viewer/video-viewer.html'
  };
}]);