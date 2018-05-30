(function() {
  'use strict';

  angular.module('esn.user-notification')
    .factory('esnUserNotificationSeverity', esnUserNotificationSeverity);

  function esnUserNotificationSeverity(
    _,
    $q,
    CounterFactory,
    esnUserNotificationProviders,
    ESN_USER_NOTIFICATION_UNREAD_REFRESH_TIMER
  ) {
    return new CounterFactory.newCounter(
      0,
      ESN_USER_NOTIFICATION_UNREAD_REFRESH_TIMER,
      _getNumberOfImportantNotifications
    );

    function _getNumberOfImportantNotifications() {
      var notificationProviders = _.values(esnUserNotificationProviders.getAll());
      var promises = notificationProviders.map(function(provider) {
        if (!provider.getNumberOfImportantNotifications) {
          return;
        }

        return provider.getNumberOfImportantNotifications();
      }).filter(Boolean);

      return $q.all(promises).then(function(result) {
        return result.reduce(function(totalCount, count) {
          totalCount += count;

          return totalCount;
        }, 0);
      });
    }
  }
})();
