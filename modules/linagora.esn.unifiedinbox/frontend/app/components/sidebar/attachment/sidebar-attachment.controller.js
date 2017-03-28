(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .controller('inboxListSidebarAttachmentController', inboxListSidebarAttachmentController);

    function inboxListSidebarAttachmentController($stateParams, PROVIDER_TYPES) {
      this.mailbox = $stateParams.context;
      this.providerType = PROVIDER_TYPES.JMAP;
    }
})();
