'use strict';

angular
  .module('esn.attachment')
  .directive('esnVideoViewer', function() {
    return {
      restrict: 'E',
      controller: function($scope, $sce) {
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
      },
      templateUrl: '/views/modules/attachment/viewer/video-viewer/video-viewer.html'
    };
  });
  