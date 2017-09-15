(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentVideoViewer', esnAttachmentVideoViewer);

  function esnAttachmentVideoViewer($sce, esnAttachmentViewerService) {
    return {
      restrict: 'E',
      scope: {
        attachment: '=',
        viewer: '='
      },
      link: link,
      templateUrl: '/views/modules/attachment/viewer/video-viewer/video-viewer.html'
    };

    function link(scope, elem) {
      scope.API = null;
      scope.onPlayerReady = function(API) {
        scope.API = API;
      };
      scope.config = {
        preload: 'none',
        sources: [
          {src: $sce.trustAsResourceUrl(scope.attachment.url), type: 'video/webm'},
          {src: $sce.trustAsResourceUrl(scope.attachment.url), type: 'video/ogg'},
          {src: $sce.trustAsResourceUrl(scope.attachment.url), type: 'video/mp4'}
        ],
        theme: {
          url: '/components/videogular-themes-default/videogular.css'
        },
        plugins: {
          controls: {
            autoHide: true,
            autoHideTime: 4000
          }
        }
      };
      scope.viewer.fitSizeContent(esnAttachmentViewerService.resizeViewer, elem.find('.videogular-container'));
    }
  }
})();
