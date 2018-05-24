(function() {
  'use strict';

  angular.module('esn.collaboration')
    .directive('esnCollaborationInvitationAcceptButton', esnCollaborationInvitationAcceptButton);

    function esnCollaborationInvitationAcceptButton(
      esnCollaborationClientService
    ) {
      return {
        link: link,
        require: '^esnCollaborationMembershipInvitationUserNotification',
        restrict: 'E',
        templateUrl: '/views/modules/collaboration/user-notifications/collaboration-invitation-accept-button.html'
      };

      function link(scope, element, attrs, invitationController) {
        scope.restActive = false;
        scope.accept = function() {
          scope.restActive = true;
          esnCollaborationClientService.join(scope.invitationCollaboration.objectType, scope.invitationCollaboration._id, scope.invitedUser._id).then(
            function() {
              scope.notification.setAcknowledged(true).then(
                function() {
                  invitationController.actionDone('accept');
                },
                function(error) {
                  scope.error = error;
                }
              ).finally(function() {
                scope.restActive = false;
              });
            },
            function(error) {
              scope.error = error;
              scope.restActive = false;
            }
          );
        };
      }
    }
})();
