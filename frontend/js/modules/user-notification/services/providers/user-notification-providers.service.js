(function(angular) {
  'use strict';

  angular.module('esn.user-notification')
    .factory('esnUserNotificationProviders', esnUserNotificationProviders);

  function esnUserNotificationProviders(esnRegistry) {
    return new esnRegistry('esnUserNotificationProviders');
  }
})(angular);
