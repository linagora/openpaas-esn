(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .factory('userStatusService', userStatusService);

    function userStatusService($q, $rootScope, session, livenotification, userStatusClientService, USER_STATUS_EVENTS, USER_STATUS_NAMESPACE) {
      var cache = {};

      session.ready.then(function() {
        var sio = livenotification(USER_STATUS_NAMESPACE);

        sio.on(USER_STATUS_EVENTS.USER_CHANGE_STATE, function(data) {
          $rootScope.$broadcast(USER_STATUS_EVENTS.USER_CHANGE_STATE, data);
          cache[data.userId] = data.state;
        });
      });

      return {
        getCurrentStatus: getCurrentStatus
      };

      function getCurrentStatus(userId) {
        if (cache[userId]) {
          return $q.when(cache[userId]);
        }

        return userStatusClientService.get(userId).then(function(response) {
          var state = response.data.current_status;

          cache[userId] = state;

          return state;
        });
      }
    }
})();
