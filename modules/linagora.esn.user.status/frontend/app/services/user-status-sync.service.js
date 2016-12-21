(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .factory('userStatusSyncService', userStatusSyncService);

    function userStatusSyncService($q, $rootScope, _, userStatusClientService, userStatusService, USER_STATUS_EVENTS) {

      return {
        synchronize: synchronize
      };

      function pusblishStatuses(statuses) {
        if (_.isEmpty(statuses)) {
          return;
        }
        $rootScope.$broadcast(USER_STATUS_EVENTS.USER_CHANGE_STATE, statuses || {});
      }

      function synchronize() {
        synchronizeCache().then(pusblishStatuses);
      }

      function synchronizeCache() {
        var cache = userStatusService.getCache();

        if (_.isEmpty(cache)) {
          return $q.when();
        }

        return userStatusClientService.getStatusForUsers(_.keys(cache)).then(function(result) {
          if (result.data && result.data.length) {
            result.data.forEach(function(status) {
              userStatusService.cacheUserStatus(status);
            });
          }

          return cache;
        });
      }
    }
})();
