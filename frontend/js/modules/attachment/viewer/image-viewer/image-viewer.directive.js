(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnImageViewer', esnImageViewer);

  function esnImageViewer(esnAttachmentViewerService) {
    return {
      restrict: 'E',
      link: link,
      templateUrl: '/views/modules/attachment/viewer/image-viewer/image-viewer.html'
    };

    function link(scope, elem) {
      var image = angular.element(elem.find('.av-img'));
      image.src = scope.file.url;
      scope.provider.fitSizeContent(esnAttachmentViewerService.resizeViewer, image);
    }
  }

})();
