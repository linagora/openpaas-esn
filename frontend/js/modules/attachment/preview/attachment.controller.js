(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentController', ESNAttachmentController);

  function ESNAttachmentController(esnAttachmentViewerService, esnAttachmentPreviewRegistryService, $element, $scope, $compile, $log) {
    var self = this;

    self.$onInit = $onInit;

    if (self.viewer) {
      self.$onDestroy = $onDestroy;

      $element.on('click', function() {
        esnAttachmentViewerService.onOpen(self.file, self.gallery);
      });
    }

    function $onInit() {
      if (self.viewer){
        self.file.url = '/api/files/' + self.file._id;
        esnAttachmentViewerService.onBuild(self.file, self.gallery);
      }
      renderContent();
    }

    function $onDestroy() {
      esnAttachmentViewerService.onDestroy(self.file, self.gallery);
    }

    function renderContent() {
      var provider, elem, template, newElt;

      if (!self.file || !self.file._id) {
        $log.debug('File does not exist or incomplete');

        return;
      }
      provider = esnAttachmentPreviewRegistryService.getProvider(self.file.contentType);

      if (!provider || !self.preview) {
        provider = esnAttachmentPreviewRegistryService.getProvider('default');
      }

      elem = angular.element('<' + provider.directive + '></' + provider.directive + '>');
      elem.attr({ attachment: 'ctrl.file', gallery: 'ctrl.gallery' });
      template = angular.element(elem);
      newElt = $compile(template)($scope);

      $element.append(newElt);
    }
  }

})();
