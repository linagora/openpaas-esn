(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .factory('userStatusService', userStatusService);

    function userStatusService($q, userStatusClientService) {
      var cache = {};

      return {
        cacheUserStatus: cacheUserStatus,
        getCache: getCache,
        getCurrentStatus: getCurrentStatus
      };

      function cacheUserStatus(data) {
        if (!data || !data._id || !data.status) {
          return;
        }
        cache[data._id] = data;

        return data;
      }

      function getCache() {
        return cache;
      }

      function getCurrentStatus(userId) {
        if (angular.isDefined(cache[userId])) {
          return $q.when(cache[userId]);
        }

        return userStatusClientService.getStatusForUser(userId).then(function(response) {
          return cacheUserStatus(response.data);
        });
      }
    }
})();
