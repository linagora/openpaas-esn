(function(angular) {
  'use strict';

  angular.module('esn.follow').directive('followList', followList);

  function followList() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/follow/list/follow-list.html'
    };
  }
})(angular);
