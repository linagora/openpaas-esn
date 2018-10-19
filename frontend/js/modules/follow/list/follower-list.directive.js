(function(angular) {
  'use strict';

  angular.module('esn.follow').directive('followerList', followerList);

  function followerList() {
    return {
      restrict: 'E',
      controller: 'followerListController',
      templateUrl: '/views/modules/follow/list/follower-list.html'
    };
  }
})(angular);
