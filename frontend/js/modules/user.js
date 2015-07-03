'use strict';

angular.module('esn.user', ['restangular', 'esn.object-type'])
  .run(function(objectTypeResolver, userAPI, Restangular) {
    objectTypeResolver.register('user', userAPI.user);
    Restangular.extendModel('users', function(model) {
      model.url = function(user) {
        return '/#/profile/' + user._id || user;
      };
      model.avatarUrl = function(user) {
        return '/api/avatars?objectType=user&email=' + user.emails[0] || user;
      };
      model.displayName = function(user) {
        if (user.firstname && user.lastname) {
          return user.firstname + ' ' + user.lastname;
        }
        return user;
      };
      return model;
    });
  })
  .factory('userAPI', function(Restangular) {

    function currentUser() {
      return Restangular.one('user').get();
    }

    function user(uuid) {
      return Restangular.one('users', uuid).get();
    }

    function getCommunities() {
      return Restangular.one('user').all('communities').getList();
    }

    function getActivityStreams(options) {
      options = options || {};
      return Restangular.one('user').all('activitystreams').getList(options);
    }

    return {
      currentUser: currentUser,
      user: user,
      getCommunities: getCommunities,
      getActivityStreams: getActivityStreams
    };
  });
