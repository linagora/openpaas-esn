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
        autoHide: true,
        autoHideTime: 3000,
        sources: [
          { src: $sce.trustAsResourceUrl(scope.file.url), type: scope.file.contentType }
        ],
        theme: {
          url: "/components/videogular-themes-default/videogular.css"
        }
      };
      scope.provider.fitSizeContent(
        angular.element(elem.find('.videogular-container')),
        esnAttachmentViewerService.fittingSize.bind(esnAttachmentViewerService),
        esnAttachmentViewerService.resizeElements.bind(esnAttachmentViewerService)
      );
      esnAttachmentViewerService.onHide(pauseVideo);

      function pauseVideo() {
        scope.API.pause();
      }
    }
  }

})();
