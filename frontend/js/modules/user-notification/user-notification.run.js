(function() {
  'use strict';

  angular.module('esn.user-notification')
    .run(ESNUserNotificationRun);

    function ESNUserNotificationRun(
      esnUserNotificationCounter,
      esnUserNotificationWebsocketListenerService
    ) {

      esnUserNotificationCounter.init();
      esnUserNotificationWebsocketListenerService.listenEvents();
    }
  })();
