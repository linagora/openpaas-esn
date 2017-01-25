(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .factory('userStatusWebsocketService', userStatusWebsocketService);

    function userStatusWebsocketService($rootScope, _, livenotification, userStatusService, USER_STATUS_EVENTS, USER_STATUS_NAMESPACE) {
      var sio;

      return {
        listen: listen
      };

      function listen() {
        if (sio) {
          return;
        }

        sio = livenotification(USER_STATUS_NAMESPACE);

        sio.on(USER_STATUS_EVENTS.USER_CHANGE_STATE, function(data) {
          var status = {};
          var cached = userStatusService.cacheUserStatus(data);

          if (!cached) {
            return;
          }

          status[cached._id] = cached;

          publishStatus(status);
        });
      }

      function publishStatus(status) {
        $rootScope.$broadcast(USER_STATUS_EVENTS.USER_CHANGE_STATE, status);
      }
    }
})();
