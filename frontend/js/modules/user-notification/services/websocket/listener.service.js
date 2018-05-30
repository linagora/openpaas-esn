(function() {
    'use strict';

    angular.module('esn.user-notification')
      .factory('esnUserNotificationWebsocketListenerService', esnUserNotificationWebsocketListenerService);

    function esnUserNotificationWebsocketListenerService(
      livenotification,
      esnUserNotificationState,
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
        esnUserNotificationState.increaseCountBy(1);
        esnUserNotificationState.refresh();
      }

      function _onUserNotificationUpdated(notificationData) {
        if (notificationData && notificationData.acknowledged) {
          esnUserNotificationState.decreaseCountBy(1);
        }

        esnUserNotificationState.refresh();
      }
    }
})();
