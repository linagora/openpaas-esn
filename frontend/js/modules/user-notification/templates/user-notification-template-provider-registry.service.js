(function(angular) {
  'use strict';

  angular.module('esn.user-notification')
    .factory('esnUserNotificationTemplateProviderRegistry', esnUserNotificationTemplateProviderRegistry);

  function esnUserNotificationTemplateProviderRegistry(esnRegistry) {
    return new esnRegistry('esnUserNotificationTemplateProviderRegistry', {
      primaryKey: 'category'
    });
  }
})(angular);
