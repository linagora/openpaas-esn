'use strict';

angular.
module('esn.attachment').
directive('esnVideoViewer', ['attachmentViewer', function(attachmentViewer) {
  return {
    // scope: {
    //   file: '='
    // },
    restrict: 'E',
    controller: function($scope, $sce) {
      var videoUrl = attachmentViewer.getFileUrl($scope.file._id);
      console.log(videoUrl);
      $scope.API = null;
      $scope.onPlayerReady = function(API) {
        $scope.API = API;
        var video = $scope.API.mediaElement[0];
        attachmentViewer.buildLightboxVideo($scope.currentTarget,video);
        console.log(video);           
      };
      $scope.$on('modalOnHidden', function() {
        console.log("child");
        $scope.API.pause();
      });
      $scope.config = {
        preload: "none",
        autoHide: true,
        autoHideTime: 3000,
        sources: [
          { src: $sce.trustAsResourceUrl(videoUrl), type: $scope.file.contentType }
        ],
        theme: {
          url: "/components/videogular-themes-default/videogular.css"
        }
      };
      //attachmentViewer.buildLightboxVideo($scope.currentTarget);
    },
    // link: function(scope, element, attrs) {
    //   var video = element.find('video');
    //   console.log(scope.video);
      
    // },
    templateUrl: '/views/modules/attachment/viewer/video-viewer/video-viewer.html'
  };
}]);