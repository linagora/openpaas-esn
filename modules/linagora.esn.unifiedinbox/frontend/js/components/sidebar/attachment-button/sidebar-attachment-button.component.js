(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')
    .component('inboxListSidebarAttachmentButton', (function() {
      return {
        templateUrl: '/unifiedinbox/views/components/sidebar/attachment-button/sidebar-attachment-button.html',
        controllerAs: 'ctrl',
        controller: function($state) {
          this.actived = $state.current.name.indexOf('.attachments');
        }
      };
    })());
})();
