(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentPreviewRegistryService', esnAttachmentPreviewRegistryService);

    function esnAttachmentPreviewRegistryService(esnRegistry) {
      var registry = esnRegistry('file-preview', {
        match: function(contentType, provider) {
          return provider.contentType.indexOf(contentType) > -1;
        }
      });

      return {
        getProvider: registry.get.bind(registry),
        getFilePreviewProviders: registry.getAll.bind(registry),
        addFilePreviewProvider: registry.add.bind(registry)
      };
    }

})();
