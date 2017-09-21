(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentController', ESNAttachmentController);

  function ESNAttachmentController($element, $scope, $compile, $log, esnAttachmentViewerService, esnAttachmentViewerGalleryService, esnAttachmentRegistryService) {
    var self = this;
    var hasPreview = self.preview || true;
    var hasViewer = self.viewer || true;

    self.$onInit = $onInit;
    self.onClick = onClick;
    self.$onDestroy = $onDestroy;

    function $onInit() {
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
      var previewer, elem, template, newElt;

      if (!self.attachment) {
        return $log.debug('File does not exist or incomplete');
      }

      previewer = esnAttachmentRegistryService.getPreviewer(self._attachment.contentType);

      if (!previewer || !hasPreview) {
        previewer = esnAttachmentRegistryService.getDefaultPreviewer();
      }

      elem = angular.element('<' + previewer.directive + '></' + previewer.directive + '>');
      elem.attr({
        attachment: 'ctrl._attachment',
        gallery: 'ctrl.gallery',
        'ng-click': 'ctrl.onClick()'
      });
      template = angular.element(elem);
      newElt = $compile(template)($scope);

      $element.append(newElt);
    }
  }
})();
