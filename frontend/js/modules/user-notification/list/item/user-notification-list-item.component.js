(function() {
  'use strict';

  angular.module('esn.user-notification')
    .component('esnUserNotificationListItem', esnUserNotificationListItem());

  function esnUserNotificationListItem() {
    return {
      bindings: {
        notification: '='
      },
      controllerAs: 'ctrl',
      templateUrl: '/views/modules/user-notification/list/item/user-notification-list-item.html'
    };
  }
})();
