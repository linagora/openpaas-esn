(function(angular) {
  'use strict';

  angular.module('esn.follow').controller('followingListController', followingListController);

  function followingListController($scope, FollowScrollBuilder, FollowPaginationHelper, _, FOLLOW_PAGE_SIZE) {
    $scope.users = [];
    $scope.loadNext = FollowScrollBuilder.build($scope, 'followings', FollowPaginationHelper.buildFollowingsPaginationProvider({limit: FOLLOW_PAGE_SIZE}, $scope.user), function(elements) {
      Array.prototype.push.apply($scope.users, _.map(elements, 'user'));
    });
  }

})(angular);
