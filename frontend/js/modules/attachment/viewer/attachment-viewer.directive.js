'use strict';

angular.
module('esn.attachment').
directive('esnAttachmentViewer', ['attachmentViewer', '$compile', function(attachmentViewer, $compile) {
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {
      var fileType = attachmentViewer.getFileType(scope.file.contentType);
      var mainContent = element.find(".lb-container");

      //var init = element.find("[data-lightbox]");
      // switch (fileType) {
      //   case 'image':
      //     // attachmentViewer.getWidthImage(scope.file._id, function(imgWidth) {
      //     //   if (imgWidth > 800) {
      //     //     imgWidth = 0.7 * $(window).width();
      //     //   }
      //     //   scope.modalDialogStyle = {
      //     //     'width': imgWidth
      //     //   };
      //     // });
      //     mainContent.html($compile('<esn-image-viewer file="file"></esn-image-viewer>')(scope));
      //     break;
      //   case 'video':
      //     mainContent.html($compile('<esn-video-viewer file="file"></esn-video-viewer>')(scope));
      //if (fileType === "video") {
        // element.find(".modal").on('hidden.bs.modal', function() {
        //   scope.$broadcast('modalOnHidden');
        //   console.log("ahihi");
        //   //console.log(esnVideoViewerCtrl.API);
        //   // if(attachmentViewer.api !== null)
        //   // attachmentViewer.pauseVideo(attachmentViewer.api);
        // });
      //}
      //     break;
      // }
      //if (fileType == "image") {
      //if (mainContent.contents().length === 0) {
        attachmentViewer.getViewer(mainContent, scope, false);
      //}
      // }
    },
    templateUrl: '/views/modules/attachment/viewer/attachment-viewer.html'
  }
}]);