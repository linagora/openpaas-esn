(function() {
  'use strict';

  angular.module('esn.user-notification')
    .factory('esnUserNotificationService', esnUserNotificationService);

    function esnUserNotificationService(
      _,
      esnUserNotificationProviders,
      esnUserNotificationState
    ) {
      return {
        addProvider: addProvider,
        getListFunctions: getListFunctions
      };

      function addProvider(provider) {
        esnUserNotificationProviders.add(provider);
        esnUserNotificationState.init();
      }

      function getListFunctions() {
        return _.values(esnUserNotificationProviders.getAll())
          .map(function(provider) {
            return provider.list;
          });
      }
    }
})();
