'use strict';

angular.module('esn.user', ['restangular', 'esn.object-type'])
  .run(['objectTypeResolver', 'userAPI', function(objectTypeResolver, userAPI) {
    objectTypeResolver.register('user', userAPI.user);
  }])
  .factory('userAPI', ['Restangular', function(Restangular) {

    function currentUser() {
      return Restangular.one('user').get();
    }

    function user(uuid) {
      return Restangular.one('users', uuid).get();
    }

    function getCommunities() {
      return Restangular.one('user').all('communities').getList();
    }

    return {
      currentUser: currentUser,
      user: user,
      getCommunities: getCommunities
    };
  }]);
