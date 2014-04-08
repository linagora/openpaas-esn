'use strict';

angular.module('esn.user', ['restangular'])
  .factory('userAPI', ['Restangular', function(Restangular) {

    function currentUser() {
      return Restangular.one('user').get();
    }

    function user(uuid) {
      return Restangular.one('user', uuid).get();
    }

    return {
      currentUser: currentUser,
      user: user
    };
  }]);
