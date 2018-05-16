(function(angular) {
  'use strict';

  angular.module('esn.app-state')
    .factory('esnAppStateService', function(
      $window,
      $rootScope,
      ESN_APP_STATE_CHANGE_EVENT
    ) {
      var foreground = true;

      return {
        listenStateEvents: listenStateEvents,
        isForeground: isForeground
      };

      function listenStateEvents() {
        $window.addEventListener('focus', function() {
          foreground = true;
          $rootScope.$broadcast(ESN_APP_STATE_CHANGE_EVENT, true);
        });

        $window.addEventListener('blur', function() {
          foreground = false;
          $rootScope.$broadcast(ESN_APP_STATE_CHANGE_EVENT, false);
        });
      }

      function isForeground() {
        return foreground;
      }
    });
})(angular);
