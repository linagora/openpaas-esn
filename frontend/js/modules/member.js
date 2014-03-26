'use strict';

angular.module('esn.member', [])
  .directive('memberDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        member: '=member'
      },
      templateUrl: '/views/member/partials/member.html'
    };
  });
