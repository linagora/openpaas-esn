(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .factory('userStatusService', userStatusService);

    function userStatusService($q, $rootScope, userStatusRestangular, session, livenotification, USER_STATUS_EVENTS, USER_STATUS_NAMESPACE) {
      var cache = {};

      session.ready.then(function() {
        var sio = livenotification(USER_STATUS_NAMESPACE);

        sio.on(USER_STATUS_EVENTS.USER_CHANGE_STATE, function(data) {
          $rootScope.$broadcast(USER_STATUS_EVENTS.USER_CHANGE_STATE, data);
          cache[data.userId] = data.state;
        });
      });

      return {
        get: get
      };

      function get(userId) {
        if (cache[userId]) {
          return $q.when(cache[userId]);
        }

        return userStatusRestangular.one('users', userId).get().then(function(response) {
          var state = response.data.state;

          cache[userId] = state;

          return state;
        });
      }
    }
})();
