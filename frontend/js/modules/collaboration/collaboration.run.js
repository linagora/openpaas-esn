(function() {
  'use strict';

  angular.module('esn.collaboration').run(run);

  function run(esnCollaborationListener, esnUserNotificationTemplateProviderRegistry) {
    esnCollaborationListener.init();
    esnUserNotificationTemplateProviderRegistry.add({
      template: 'esn-collaboration-membership-invitation-user-notification',
      category: 'collaboration:membership:invite'
    });
    esnUserNotificationTemplateProviderRegistry.add({
      template: 'esn-collaboration-membership-request-accepted-user-notification',
      category: 'collaboration:membership:accepted'
    });
    esnUserNotificationTemplateProviderRegistry.add({
      template: 'esn-collaboration-membership-request-declined-user-notification',
      category: 'collaboration:membership:refused'
    });
    esnUserNotificationTemplateProviderRegistry.add({
      template: 'esn-collaboration-join-user-notification',
      category: 'collaboration:join'
    });
  }
})();
