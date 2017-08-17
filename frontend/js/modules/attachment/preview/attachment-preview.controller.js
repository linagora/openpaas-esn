(function() {
  'use strict';

  angular.module('esn.attachment')
    .controller('ESNAttachmentPreviewController', ESNAttachmentPreviewController);

  function ESNAttachmentPreviewController(esnAttachmentViewerService, esnAttachmentPreviewRegistryService, $element, $scope, $compile, $log) {
    var self = this;

    $element.on('click', function() {
      openViewer();
    });

    self.file.url = '/api/files/' + self.file._id;
    self.$onInit = $onInit;
    self.$onDestroy = $onDestroy;

    function $onInit() {
      esnAttachmentViewerService.onBuild(self.file);
      renderContent();
    }

    function openViewer() {
      esnAttachmentViewerService.onOpen(self.file);
    }

    function $onDestroy() {
      esnAttachmentViewerService.onDestroy(self.file);
    }

    function renderContent() {
      var provider, elem, template, newElt;

      if (!self.file || !self.file._id) {
        $log.debug('File does not exist or incomplete');

        return;
      }
      provider = esnAttachmentPreviewRegistryService.getProvider(self.file.contentType);
      provider = provider || esnAttachmentPreviewRegistryService.getProvider('default');

      elem = angular.element('<' + provider.directive + '></' + provider.directive + '>');
      elem.attr({ attachment: 'ctrl.file', gallery: 'ctrl.gallery'});
      template = angular.element(elem);
      newElt = $compile(template)($scope);

      $element.append(newElt);
    }
  }

})();
