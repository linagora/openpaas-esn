(function(angular) {
  'use strict';

  angular
    .module('esn.attachments-selector')
    .component('esnAttachmentsSelector', {
      templateUrl: '/views/modules/attachments-selector/attachments-selector.html',
      bindings: {
        attachmentHolder: '='
      }
    });
})(angular);
