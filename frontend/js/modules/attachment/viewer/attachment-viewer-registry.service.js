'use strict';

angular
  .module('esn.attachment')
  .factory('esnAttachmentViewerRegistryService', ['esnRegistry', function(esnRegistry) {
    var registry = esnRegistry('file-viewer', {
      match: function(contentType, provider) {
        return provider.contentType.indexOf(contentType) > -1;
      }
    });

    return {
      getProvider: registry.get.bind(registry),
      getFileViewerProviders: registry.getAll.bind(registry),
      addFileViewerProvider: registry.add.bind(registry)
    };
  }]);
