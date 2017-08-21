(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnAttachment', esnAttachment());

  function esnAttachment() {
    return {
      bindings: {
        file: '=',
        gallery: '=',
        preview: '=',
        viewer: '='
      },
      controllerAs: 'ctrl',
      controller: 'ESNAttachmentController'
    };
  }

})();
