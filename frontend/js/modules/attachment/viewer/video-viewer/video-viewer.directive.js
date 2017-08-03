(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnVideoViewer', esnVideoViewer);

  function esnVideoViewer(esnAttachmentViewerService, $sce) {
    return {
      restrict: 'E',
      link: link,
      templateUrl: '/views/modules/attachment/viewer/video-viewer/video-viewer.html'
    };

    function link(scope, elem) {
      scope.API = null;
      scope.onPlayerReady = function(API) {
        scope.API = API;
      };
      scope.config = {
        preload: "none",
        sources: [
          { src: $sce.trustAsResourceUrl(scope.file.url), type: scope.file.contentType }
        ],
        theme: {
          url: "/components/videogular-themes-default/videogular.css"
        },
        plugins: {
          controls: {
            autoHide: true,
            autoHideTime: 4000
          }
        }
      };

      scope.onError = function(event) {
        console.log("VIDEOGULAR ERROR EVENT");
        console.log(event);
      };

      scope.onSeeking = function(currentTime, duration) {
        console.log(currentTime);
        console.log(duration);
      };

      scope.provider.fitSizeContent.call(
        scope.provider,
        esnAttachmentViewerService.onResize,
        elem.find('.videogular-container')
      );
    }
  }

})();
