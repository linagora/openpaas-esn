(function() {
  'use strict';

  angular.module('esn.attachment')
    .directive('esnAttachmentViewer', esnAttachmentViewer);

  function esnAttachmentViewer(esnAttachmentViewerRegistryService, $compile) {
    return {
      restrict: 'E',
      link: link
    };

    function link(scope, element) {
      var elem;
      var template;
      var provider = esnAttachmentViewerRegistryService.getProvider(scope.file.contentType);
      if (provider) {
        elem = angular.element('<esn-' + provider.directive + '-viewer></esn-' + provider.directive + '-viewer>');
      } else {
        provider = esnAttachmentViewerRegistryService.getProvider('default');
        elem = angular.element('<esn-default-viewer></esn-default-viewer>');
      }
      scope.provider = provider;
      template = angular.element(elem);
      element.html($compile(template)(scope));
    }
  }

})();
