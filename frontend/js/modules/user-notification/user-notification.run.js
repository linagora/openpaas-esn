(function() {
  'use strict';

  angular.module('esn.user-notification')
    .run(run);

  function run(
    esnUserNotificationWebsocketListenerService,
    esnUserNotificationTemplateProviderRegistry,
    esnUserNotificationService,
    esnUserNotificationDefaultProvider
  ) {
    esnUserNotificationService.addProvider(esnUserNotificationDefaultProvider);
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
