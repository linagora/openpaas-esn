(function() {
  'use strict';

  angular.module('esn.user-notification')
    .run(ESNUserNotificationRun);

    function ESNUserNotificationRun(
      esnUserNotificationCounter,
      esnUserNotificationWebsocketListenerService,
      esnUserNotificationTemplateProviderRegistry
    ) {

      esnUserNotificationCounter.init();
      esnUserNotificationWebsocketListenerService.listenEvents();
      esnUserNotificationTemplateProviderRegistry.add({
        template: 'esn-user-notification-external',
        category: 'external'
      });
      esnUserNotificationTemplateProviderRegistry.add({
        template: 'esn-simple-user-notification',
        category: 'simple'
      });
    }
  })();
