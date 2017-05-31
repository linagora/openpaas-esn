(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calendarUsersCache', calendarUsersCache);

    function calendarUsersCache(Cache, userAPI, userUtils, CAL_USER_CACHE_TTL) {

      var cache = new Cache({
        loader: _userLoader,
        ttl: CAL_USER_CACHE_TTL
      });

      return {
        getUser: getUser,
        getUserDisplayName: getUserDisplayName
      };

      function _userLoader(userId) {
        return userAPI.user(userId);
      }

      function getUser(userId) {
        return cache.get(userId).then(function(response) {
          return response.data;
        });
      }

      function getUserDisplayName(userId) {
        return getUser(userId).then(function(user) {
          return userUtils.displayNameOf(user);
        });
      }
    }
})();
