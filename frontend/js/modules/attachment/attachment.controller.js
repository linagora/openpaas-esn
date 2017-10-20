(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentController', ESNAttachmentController);

  function ESNAttachmentController($compile, $element, $scope, $log, esnAttachmentViewerService, esnAttachmentViewerGalleryService, esnAttachmentRegistryService) {
    var self = this;
    var hasPreview;
    var hasViewer;

    self.$onInit = $onInit;
    self.onClick = onClick;
    self.renderContent = renderContent;
    self.$onDestroy = $onDestroy;

    function $onInit() {
      hasPreview = self.preview !== false;
      hasViewer = self.viewer !== false;
      self._attachment = {
        url: '/api/files/' + self.attachment._id,
        name: self.attachment.name,
        contentType: self.attachment.contentType,
        length: self.attachment.length
      };

      if (hasViewer) {
        esnAttachmentViewerGalleryService.addFileToGallery(self._attachment, self.gallery);
      }

      renderContent();
    }

    function onClick() {
      if (hasViewer) {
        esnAttachmentViewerService.open(self._attachment, self.gallery);
      }
    }

    function $onDestroy() {
      if (hasViewer) {
        esnAttachmentViewerGalleryService.removeFileFromGallery(self._attachment, self.gallery);
      }
    }

    function renderContent() {
      if (!self._attachment) {
        return $log.debug('File does not exist or incomplete');
      }

      var previewer = esnAttachmentRegistryService.getPreviewer(self._attachment.contentType);

      if (!previewer || !hasPreview) {
        previewer = esnAttachmentRegistryService.getDefaultPreviewer();
      }

      $element.append($compile('<' + previewer.directive + ' attachment="$ctrl._attachment", gallery="$ctrl.gallery", ng-click="$ctrl.onClick()" />')($scope));
    }
  }
})();
