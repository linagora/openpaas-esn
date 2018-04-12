(function() {
    'use strict';

    angular.module('esn.user-notification')
      .factory('esnUserNotificationWebsocketListenerService', esnUserNotificationWebsocketListenerService);

    function esnUserNotificationWebsocketListenerService(
      livenotification,
      esnUserNotificationCounter,
      ESN_USER_NOTIFICATION_WEBSOCKET
    ) {
      return {
        listenEvents: listenEvents
      };

      function listenEvents() {
        var sio = livenotification(ESN_USER_NOTIFICATION_WEBSOCKET.NAMESPACE);

        sio.on(ESN_USER_NOTIFICATION_WEBSOCKET.NOTIFICATION.CREATED, _onUserNotificationCreated);
        sio.on(ESN_USER_NOTIFICATION_WEBSOCKET.NOTIFICATION.UPDATED, _onUserNotificationUpdated);

        return {
          sio: sio
        };
      }

      function _onUserNotificationCreated() {
        esnUserNotificationCounter.increaseBy(1);
        esnUserNotificationCounter.refresh();
      }

      function _onUserNotificationUpdated(notificationData) {
        if (notificationData && notificationData.acknowledged) {
          esnUserNotificationCounter.decreaseBy(1);
        }

        esnUserNotificationCounter.refresh();
      }
    }
})();
