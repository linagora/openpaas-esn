(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentRegistryService', esnAttachmentRegistryService);

  function esnAttachmentRegistryService(esnRegistry) {
    var viewerRegistry = esnRegistry('file-viewer', {
      match: function(contentType, provider) {
        return provider.contentType.indexOf(contentType) > -1;
      }
    });

    var previewRegistry = esnRegistry('file-preview', {
      match: function(contentType, provider) {
        return provider.contentType.indexOf(contentType) > -1;
      }
    });

    return {
      getViewer: viewerRegistry.get.bind(viewerRegistry),
      addViewer: viewerRegistry.add.bind(viewerRegistry),
      getPreviewer: previewRegistry.get.bind(previewRegistry),
      addPreviewer: previewRegistry.add.bind(previewRegistry)
    };
  }

})();
