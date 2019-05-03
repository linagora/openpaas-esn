(function(angular) {
  'use strict';

  angular.module('esn.user')
    .factory('userUtils', userUtils);

  function userUtils() {
    return {
      displayNameOf: displayNameOf
    };

    function displayNameOf(user) {
      if (!user.firstname && !user.lastname) {
        return user.preferredEmail;
      }

      return (user.firstname && user.lastname) ? user.firstname + ' ' + user.lastname : (user.firstname || user.lastname);
    }
  }
})(angular);
