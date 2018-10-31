(function(angular) {
  'use strict';

  angular
    .module('esn.attachments-selector')
    .component('esnAttachmentsSelector', {
      templateUrl: '/views/modules/attachments-selector/attachments-selector.html',
      controller: 'esnAttachmentsSelectorController',
      bindings: {
        attachments: '<?',
        attachmentType: '<?',
        attachmentFilter: '<?',
        onAttachmentsUpdate: '&?',
        uploadAttachments: '&?',
        attachmentHolder: '=?'
      }
    });
})(angular);
