'use strict';

angular.module('esn.authentication', ['esn.http'])
  .factory('tokenAPI', function(esnRestangular) {

    function getNewToken() {
      return esnRestangular.one('authenticationtoken').get();
    }

    return {
      getNewToken: getNewToken
    };
  });
