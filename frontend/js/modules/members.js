'use strict';

angular.module('esn.members', [])
  .directive('memberDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        member: '=member'
      },
      templateUrl: '/views/members/partials/member.html'
    };
  });
