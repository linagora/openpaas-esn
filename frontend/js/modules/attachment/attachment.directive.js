'use strict';

angular.
module('esn.attachment').
directive('esnAttachment', ['attachmentViewer', function(attachmentViewer) {
  return {
    scope: {
      file: '=attachment'
    },
    controller: esnAttachmentController,
    link: function(scope, element, attrs) {
      element.on('click', function(event) {
        var mainContent = $('body').find('esn-attachment-viewer').find(".lb-container");
        var currentTaretVideo = element.find('[data-lightbox^="video"]');
        var currentTaretImage = element.find('[data-lightbox^="image"]');
        if (mainContent.children(':first').prop('tagName') === "IMG") {       	
          if (currentTaretVideo.length !== 0) {
          	mainContent.children(':first').remove();
            attachmentViewer.getViewer(mainContent, scope, currentTaretVideo);
          }
        } else if (mainContent.children(':first').prop('tagName') === "ESN-VIDEO-VIEWER") {
        	if (currentTaretImage.length !== 0) {
          	mainContent.children(':first').remove();
            attachmentViewer.getViewer(mainContent, scope, currentTaretVideo);
          }
        }
      });
    },
    controllerAs: 'ctrl',
    templateUrl: '/views/modules/attachment/attachment.html'
  }
}]);

function esnAttachmentController($scope, attachmentViewer, $compile) {
  this.attachment = $scope.file;
  this.fileType = attachmentViewer.getFileType(this.attachment.contentType);
  this.fileUrl = attachmentViewer.getFileUrl(this.attachment._id);

  if ($('body').find('esn-attachment-viewer').length === 0) {
    var elem = angular.element('<esn-attachment-viewer id="esnAttachmentViewer"></esn-attachment-viewer>');
    var template = angular.element(elem);
    var newElt = $compile(template)($scope);
    template.scope().file = this.attachment;
    $('body').append(newElt);
  }
}