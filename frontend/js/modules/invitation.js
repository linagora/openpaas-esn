'use strict';

angular.module('esn.invitation', ['restangular'])
.factory('invitationAPI', ['Restangular', function(Restangular) {
  function get(id) {
    return Restangular.one('invitation', id).get();
  }

  return {
    get: get
  };
}]);
