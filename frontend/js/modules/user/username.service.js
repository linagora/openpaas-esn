(function(angular) {
  'use strict';

  angular.module('esn.user')
    .factory('usernameService', usernameService);

  function usernameService(Cache, userAPI, userUtils) {
    var cache = new Cache({
      loader: _userNameLoader
    });

    return {
      getFromId: getFromId
    };

    function getFromId(userId) {
      return cache.get(userId);
    }

    function _userNameLoader(userId) {
      return userAPI.user(userId).then(function(response) {
        return userUtils.displayNameOf(response.data);
      });
    }
  }
})(angular);
