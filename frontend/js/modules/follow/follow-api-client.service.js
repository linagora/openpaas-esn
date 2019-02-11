(function(angular) {
  'use strict';

  angular.module('esn.follow').factory('followAPI', followAPI);

  function followAPI(esnRestangular, session) {
    return {
      follow: follow,
      unfollow: unfollow,
      getFollowers: getFollowers,
      getFollowersHeaders: getFollowersHeaders,
      getFollowings: getFollowings,
      getFollowingsHeaders: getFollowingsHeaders
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

    function getFollowersHeaders(user) {
      return esnRestangular.one('users', user._id).one('followers').head();
    }

    function getFollowings(user, options) {
      return esnRestangular.one('users', user._id).getList('followings', options);
    }

    function getFollowingsHeaders(user) {
      return esnRestangular.one('users', user._id).one('followings').head();
    }
  }

})(angular);
