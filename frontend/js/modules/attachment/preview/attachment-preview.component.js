(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnAttachmentPreview', esnAttachmentPreview());

  function esnAttachmentPreview() {
    return {
      bindings: {
        file: '=',
        gallery: '='
      },
      controllerAs: 'ctrl',
      controller: 'ESNAttachmentPreviewController'
    };
  }

})();
