(function() {
  'use strict';

  angular.module('esn.user-notification')
    .component('esnUserNotificationSubheader', esnUserNotificationSubheader());

  function esnUserNotificationSubheader() {
    return {
      controllerAs: 'ctrl',
      templateUrl: '/views/modules/user-notification/subheader/user-notification-subheader.html'
    };
  }

})();
