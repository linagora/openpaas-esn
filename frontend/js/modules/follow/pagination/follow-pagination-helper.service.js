(function(angular) {
  'use strict';

  angular.module('esn.follow').factory('FollowPaginationHelper', FollowPaginationHelper);

  function FollowPaginationHelper(FollowPaginationProvider, followAPI) {
    return {
      buildFollowersPaginationProvider: buildFollowersPaginationProvider,
      buildFollowingsPaginationProvider: buildFollowingsPaginationProvider
    };

    function buildFollowersPaginationProvider(options, user) {
      return new FollowPaginationProvider(followAPI.getFollowers, options, user);
    }

    function buildFollowingsPaginationProvider(options, user) {
      return new FollowPaginationProvider(followAPI.getFollowings, options, user);
    }
  }
})(angular);
