(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnAttachment', {
      bindings: {
        attachment: '='
      },
      controllerAs: 'ctrl',
      controller: ['esnAttachmentViewerService', '$scope', function(esnAttachmentViewerService, $scope) {
        $scope.file = this.attachment;
        $scope.file.url = esnAttachmentViewerService.getFileUrl($scope.file._id);
        this.openViewer = function() {
          esnAttachmentViewerService.openViewer($scope);
        };
      }],
      templateUrl: '/views/modules/attachment/attachment.html'
    });
})();
