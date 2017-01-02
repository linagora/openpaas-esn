(function() {
  'use strict';

  angular.module('linagora.esn.user-status')
    .factory('userStatusClientService', userStatusClientService);

    function userStatusClientService(userStatusRestangular) {

      return {
        getStatusForUser: getStatusForUser,
        getStatusForUsers: getStatusForUsers
      };

      function getStatusForUser(userId) {
        return userStatusRestangular.one('users', userId).get();
      }

      function getStatusForUsers(usersId) {
        return userStatusRestangular.one('users').customPOST(usersId);
      }
    }
})();
