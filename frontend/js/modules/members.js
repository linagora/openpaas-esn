'use strict';

angular.module('esn.members', [])
  .directive('memberDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        user: '=user'
      },
      templateUrl: '/views/members/partials/member.html'
    };
  });
