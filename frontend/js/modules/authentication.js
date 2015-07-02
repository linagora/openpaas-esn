'use strict';

angular.module('esn.authentication', ['restangular'])
  .factory('tokenAPI', function(Restangular) {

    function getNewToken() {
      return Restangular.one('authenticationtoken').get();
    }

    return {
      getNewToken: getNewToken
    };
  });
