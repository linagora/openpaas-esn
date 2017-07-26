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
      var provider = esnAttachmentViewerRegistryService.getProvider(scope.file.contentType);
      scope.provider = provider;
      if (provider) {
        elem = angular.element('<esn-' + provider.name + '-viewer></esn-' + provider.name + '-viewer>');
      } else {
        provider = esnAttachmentViewerRegistryService.getProvider('default');
        elem = angular.element(provider.render(scope.file));
      }
      var template = angular.element(elem);
      element.html($compile(template)(scope));
    }
  }

})();
