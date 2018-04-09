(function(angular) {
  'use strict';

  angular.module('esn.community').controller('communityViewController', communityViewController);

  function communityViewController($rootScope, $scope, $state, $log, session, communityAPI, communityService, objectTypeAdapter, community, memberOf) {
    $scope.community = community;
    $scope.user = session.user;
    $scope.error = false;
    $scope.loading = false;
    $scope.writable = community.writable;
    $scope.streams = memberOf.map(function(collaboration) {
      return objectTypeAdapter.adapt(collaboration);
    });

    $scope.$on('collaboration:membership', function() {
      communityAPI.get($scope.community._id).then(function(response) {
        $scope.writable = response.data.writable;
      });
    });

    function currentCommunityMembershipHandler(event, msg) {
      if (msg && msg.collaboration && msg.collaboration.objectType !== 'community') {
        return;
      }
      $log.debug('Got a community membership event on community', msg);
      if (msg && msg.collaboration.id === $scope.community._id) {
        communityAPI.get(msg.collaboration.id).then(function(response) {
          $scope.writable = response.data.writable;
          $scope.community = response.data;
        });
      }
    }

    var unregisterJoinEvent = $rootScope.$on('collaboration:join', currentCommunityMembershipHandler);
    var unregisterLeaveEvent = $rootScope.$on('collaboration:leave', currentCommunityMembershipHandler);

    $scope.$on('$destroy', function() {
      unregisterJoinEvent();
      unregisterLeaveEvent();
    });

    $scope.onLeave = function() {
      $state.go('community.list');
    };

    $scope.reload = function() {
      communityAPI.get($scope.community._id)
      .then(function(response) {
        $scope.community = response.data;
      });
    };

    $scope.joinFailure = function() {
      $log.error('unable to join community');
      $scope.reload();
    };

    $scope.leaveFailure = function() {
      $log.error('unable to leave community');
      $scope.reload();
    };

    $scope.requestMembershipFailure = function() {
      $log.error('unable to request membership to the community');
      $scope.reload();
    };

    $scope.cancelRequestMembershipFailure = function() {
      $log.error('unable to cancel request membership to the community');
      $scope.reload();
    };

    $scope.canRead = function() {
      return communityService.canRead($scope.community);
    };
    $scope.isCommunityMember = function() {
      return communityService.isMember($scope.community);
    };
    $scope.isCommunityManager = function() {
      return communityService.isManager($scope.community, session.user);
    };
    $scope.showMembershipRequestsWidget = function() {
      return $scope.isCommunityManager() && $scope.community.type !== 'open';
    };
  }

})(angular);
