(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnAttachment', {
      bindings: {
        attachment: '='
      },
      controllerAs: 'ctrl',
      controller: ['attachmentViewerService', '$scope', function(attachmentViewerService, $scope) {
        $scope.file = this.attachment;
        $scope.file.url = attachmentViewerService.getFileUrl($scope.file._id);
        this.openViewer = function() {
          attachmentViewerService.openViewer($scope);
        };
      }],
      templateUrl: '/views/modules/attachment/attachment.html'
    });
})();
