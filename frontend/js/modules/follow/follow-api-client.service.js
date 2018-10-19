(function(angular) {
  'use strict';

  angular.module('esn.follow').factory('followAPI', followAPI);

  function followAPI(esnRestangular, session) {
    return {
      follow: follow,
      unfollow: unfollow,
      getFollowers: getFollowers,
      getFollowings: getFollowings
    };

    function follow(user) {
      return esnRestangular.all('users').one(session.user._id).one('followings', user._id).customPUT();
    }

    function unfollow(user) {
      return esnRestangular.all('users').one(session.user._id).all('followings').customDELETE(user._id);
    }

    function getFollowers(user, options) {
      return esnRestangular.one('users', user._id).getList('followers', options);
    }

    function getFollowings(user, options) {
      return esnRestangular.one('users', user._id).getList('followings', options);
    }
  }

})(angular);
