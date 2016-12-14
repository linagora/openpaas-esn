(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .factory('userStatusClientService', userStatusClientService);

    function userStatusClientService(userStatusRestangular) {

      return {
        get: get
      };

      function get(userId) {
        return userStatusRestangular.one('users', userId).get();
      }
    }
})();
