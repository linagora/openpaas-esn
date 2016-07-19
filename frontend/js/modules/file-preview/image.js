'use strict';

(function() {

  var provider = {
    name: 'image',
    contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
  };
  angular.module('esn.file-preview.image', ['esn.file-preview'])
    .run(function(filePreviewService) {
      filePreviewService.addFilePreviewProvider(provider);
    })
    .directive('filePreviewImage', function() {
      return {
        restrict: 'E',
        scope: {
            file: '='
          },
        templateUrl: '/views/modules/file-preview/file-preview-image.html'
      };
    });
})();
