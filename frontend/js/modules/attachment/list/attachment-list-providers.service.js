(function() {
  'use strict';

  angular.module('esn.attachment-list')
    .factory('esnAttachmentListProviders', esnAttachmentListProviders);

  function esnAttachmentListProviders(Providers) {
    return new Providers();
  }
})();
