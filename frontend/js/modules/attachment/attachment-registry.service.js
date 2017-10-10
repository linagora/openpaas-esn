(function() {
  'use strict';

  angular.module('esn.attachment')
    .factory('esnAttachmentRegistryService', esnAttachmentRegistryService);

  function esnAttachmentRegistryService(esnRegistry, ESN_ATTACHMENT_DEFAULT_VIEWER, ESN_ATTACHMENT_DEFAULT_PREVIEW) {
    var viewerRegistry = esnRegistry('file-viewer', {
      match: function(contentType, provider) {
        return provider.contentType.indexOf(contentType) > -1;
      }
    });

    var previewerRegistry = esnRegistry('file-previewer', {
      match: function(contentType, provider) {
        return provider.contentType.indexOf(contentType) > -1;
      }
    });

    function getDefaultPreviewer() {
      return ESN_ATTACHMENT_DEFAULT_PREVIEW;
    }

    function getDefaultViewer() {
      return ESN_ATTACHMENT_DEFAULT_VIEWER;
    }

    return {
      getViewer: viewerRegistry.get.bind(viewerRegistry),
      addViewer: viewerRegistry.add.bind(viewerRegistry),
      getDefaultViewer: getDefaultViewer,
      getPreviewer: previewerRegistry.get.bind(previewerRegistry),
      addPreviewer: previewerRegistry.add.bind(previewerRegistry),
      getDefaultPreviewer: getDefaultPreviewer
    };
  }
})();
