(function(angular) {
  'use strict';

  angular.module('esn.follow').directive('followingList', followingList);

  function followingList() {
    return {
      restrict: 'E',
      controller: 'followingListController',
      templateUrl: '/views/modules/follow/list/following-list.html'
    };
  }
})(angular);
