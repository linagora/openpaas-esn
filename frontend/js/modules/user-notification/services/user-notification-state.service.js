(function() {
  'use strict';

  angular.module('esn.user-notification')
    .factory('esnUserNotificationState', esnUserNotificationState);

  function esnUserNotificationState(
    esnUserNotificationCounter,
    esnUserNotificationSeverity
  ) {
    return {
      getCount: getCount,
      getNumberOfImportantNotifications: getNumberOfImportantNotifications,
      decreaseCountBy: decreaseCountBy,
      decreaseNumberOfImportantNotificationsBy: decreaseNumberOfImportantNotificationsBy,
      increaseCountBy: increaseCountBy,
      increaseNumberOfImportantNotificationsBy: increaseNumberOfImportantNotificationsBy,
      init: init,
      refresh: refresh
    };

    function init() {
      esnUserNotificationCounter.init();
      esnUserNotificationSeverity.init();
    }

    function refresh() {
      esnUserNotificationCounter.refresh();
      esnUserNotificationSeverity.refresh();
    }

    function getCount() {
      return esnUserNotificationCounter.count;
    }

    function increaseCountBy(number) {
      esnUserNotificationCounter.increaseBy(number);
    }

    function decreaseCountBy(number) {
      esnUserNotificationCounter.decreaseBy(number);
    }

    function getNumberOfImportantNotifications() {
      return esnUserNotificationSeverity.count;
    }

    function increaseNumberOfImportantNotificationsBy(number) {
      return esnUserNotificationSeverity.increaseBy(number);
    }

    function decreaseNumberOfImportantNotificationsBy(number) {
      return esnUserNotificationSeverity.decreaseBy(number);
    }
  }
})();
