'use strict';

angular
  .module('esn.attachment')
  .directive('esnVideoViewer', ['esnAttachmentViewerService', '$sce', '$document', function(esnAttachmentViewerService, $sce, $document) {
    return {
      restrict: 'E',
      link: function($scope, $elem) {
        $scope.API = null;
        $scope.onPlayerReady = function(API) {
          $scope.API = API;
          var $video = angular.element($scope.API.mediaElement[0]);
        };
        // angular.element('body').on('click', function() {
        //   console.log(esnAttachmentViewerService.onHide());
        // });
        
        $scope.config = {
          preload: "none",
          autoHide: true,
          autoHideTime: 3000,
          sources: [
            { src: $sce.trustAsResourceUrl($scope.file.url), type: $scope.file.contentType }
          ],
          theme: {
            url: "/components/videogular-themes-default/videogular.css"
          }
        };
        $scope.provider.fitSizeContent(
          angular.element($elem.find('.videogular-container')),
          esnAttachmentViewerService.fittingSize.bind(esnAttachmentViewerService),
          esnAttachmentViewerService.resizeContainer.bind(esnAttachmentViewerService)
        );
      },
      templateUrl: '/views/modules/attachment/viewer/video-viewer/video-viewer.html'
    };
  }]);