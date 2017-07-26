(function() {
  'use strict';

  angular.module('esn.attachment')
    .component('esnAttachment', {
      bindings: {
        attachment: '='
      },
      controllerAs: 'ctrl',
      controller: 'ESNAttachmentController',
      templateUrl: '/views/modules/attachment/attachment.html'
    });

})();
