(function() {
  'use strict';

  angular.module('esn.user-notification')
    .run(run);

    function run(
      esnUserNotificationCounter,
      esnUserNotificationWebsocketListenerService,
      esnUserNotificationTemplateProviderRegistry
    ) {

      esnUserNotificationCounter.init();
      esnUserNotificationWebsocketListenerService.listenEvents();
      esnUserNotificationTemplateProviderRegistry.add({
        template: 'esn-user-notification-external-template',
        category: 'external'
      });
      esnUserNotificationTemplateProviderRegistry.add({
        template: 'esn-user-notification-simple-template',
        category: 'simple'
      });
    }
  })();
