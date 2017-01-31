(function() {
  'use strict';

  angular
    .module('linagora.esn.unifiedinbox')
    .component('inboxListSidebarAttachment', inboxListSidebarAttachment());

  function inboxListSidebarAttachment() {
    return {
      templateUrl: '/unifiedinbox/views/components/sidebar/attachment/sidebar-attachment.html',
      controllerAs: 'ctrl',
      controller: 'inboxListSidebarAttachmentController'
    };
  }
})();
