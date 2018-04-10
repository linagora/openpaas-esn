(function(angular) {
  'use strict';

  angular.module('esn.community').directive('communityListItem', communityListItem);

  function communityListItem(communityAPI, communityService, session, $log, $state) {
    return {
      restrict: 'E',
      scope: {
        community: '=',
        actions: '='
      },
      replace: true,
      templateUrl: '/views/modules/community/list/item/community-list-item.html',
      link: function($scope) {
        function refreshCommunity() {
          communityAPI.get($scope.community._id).then(function(response) {
            $scope.community = response.data;
          }, function(err) {
            $log.error('Error while loading community', err);
          });
        }

        function runAndRefresh(promise) {
          return promise.then(refreshCommunity, refreshCommunity);
        }

        $scope.$watch('community', function() {
          $scope.canJoin = communityService.canJoin($scope.community, session.user);
          $scope.canLeave = communityService.canLeave($scope.community, session.user);
          $scope.canRequestMembership = communityService.canRequestMembership($scope.community, session.user);
          $scope.canCancelMembership = communityService.canCancelRequestMembership($scope.community, session.user);

          $scope.actionVisible = $scope.actions && ($scope.canJoin || $scope.canLeave || $scope.canRequestMembership || $scope.canCancelMembership);
        });

        $scope.join = function() {
          $scope.canJoin = false;
          communityService.join($scope.community, session.user).then(function() {
            $state.go('community.view', { id: $scope.community._id });
          }, refreshCommunity);
        };

        $scope.leave = function() {
          $scope.canLeave = false;
          runAndRefresh(communityService.leave($scope.community, session.user));
        };

        $scope.requestMembership = function() {
          $scope.canRequestMembership = false;
          runAndRefresh(communityService.requestMembership($scope.community, session.user));
        };

        $scope.cancelMembership = function() {
          $scope.canCancelMembership = false;
          runAndRefresh(communityService.cancelRequestMembership($scope.community, session.user));
        };
      }
    };
  }
})(angular);
