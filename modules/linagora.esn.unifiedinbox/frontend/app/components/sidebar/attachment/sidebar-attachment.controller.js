(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxListSidebarAttachmentController', inboxListSidebarAttachmentController);

    function inboxListSidebarAttachmentController($stateParams, PROVIDER_TYPES) {
      this.mailbox = $stateParams.mailbox;
      this.providerType = PROVIDER_TYPES.JMAP;
    }
})();
