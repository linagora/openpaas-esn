(function() {
  'use strict';

  angular.module('esn.collaboration')
    .directive('esnCollaborationMembershipInvitationUserNotification', esnCollaborationMembershipInvitationUserNotification);

  function esnCollaborationMembershipInvitationUserNotification(
    $q,
    objectTypeResolver,
    session
  ) {
    return {
      controller: controller,
      restrict: 'E',
      replace: true,
      scope: {
        notification: '='
      },
      templateUrl: '/views/modules/collaboration/user-notifications/collaboration-membership-invitation.html'
    };

    function controller($scope) {
      var userResolver = objectTypeResolver.resolve($scope.notification.subject.objectType, $scope.notification.subject.id);
      var collaborationResolver = objectTypeResolver.resolve($scope.notification.complement.objectType, $scope.notification.complement.id);

      this.actionDone = function(action) {
        $scope.notification.actionDone = action;
      };

      $scope.invitedUser = session.user;
      $scope.error = false;

      $q.all({user: userResolver, collaboration: collaborationResolver}).then(function(result) {
        $scope.invitationSender = result.user.data;
        $scope.invitationCollaboration = result.collaboration.data;
        $scope.invitationCollaboration.objectType = $scope.notification.complement.objectType;
        $scope.collaborationPath = $scope.notification.complement.objectType === 'community' ? 'communities' : 'projects';
      }, function() {
        $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    }
  }
})();
