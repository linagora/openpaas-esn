(function() {
    'use strict';

    angular.module('esn.attachment')
      .component('esnAttachment', esnAttachment());

    function esnAttachment() {
      return {
        bindings: {
          attachment: '='
        },
        controllerAs: 'ctrl',
        controller: 'ESNAttachmentController',
        templateUrl: '/views/modules/attachment/attachment.html'
      };
    }

})();
