(function() {
  'use strict';

  angular.module('esn.user-notification')
    .factory('esnUserNotificationCounter', esnUserNotificationCounter);

  function esnUserNotificationCounter(
    esnUserNotificationService,
    CounterFactory,
    ESN_USER_NOTIFICATION_UNREAD_REFRESH_TIMER
  ) {
    return new CounterFactory.newCounter(0, ESN_USER_NOTIFICATION_UNREAD_REFRESH_TIMER, esnUserNotificationService.getUnreadCount);
  }
})();
