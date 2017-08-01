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
      scope.onPlayerReady = onPlayerReady;
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
      scope.provider.fitSizeContent.call(
        scope.provider,
        esnAttachmentViewerService.onResize,
        elem.find('.videogular-container')
      );

      esnAttachmentViewerService.onHide(pauseVideo);

      function onPlayerReady(API) {
         scope.API = API;
      }

      function pauseVideo() {
        scope.API.pause();
      }
    }
  }

})();
