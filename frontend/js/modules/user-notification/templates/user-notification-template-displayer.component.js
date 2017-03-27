(function() {
  'use strict';

  angular.module('esn.user-notification')
    .component('esnUserNotificationTemplateDisplayer', esnUserNotificationTemplateDisplayer());

    function esnUserNotificationTemplateDisplayer() {
      return {
        bindings: {
          notification: '='
        },
        controllerAs: 'ctrl',
        templateUrl: '/views/modules/user-notification/templates/user-notification-template-displayer.html'
      };
    }
})();
