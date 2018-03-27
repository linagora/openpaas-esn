(function() {
  'use strict';

  angular.module('esn.collaboration')
    .directive('esnCollaborationInvitationDeclineButton', esnCollaborationInvitationDeclineButton);

    function esnCollaborationInvitationDeclineButton(
      esnCollaborationClientService,
      esnUserNotificationService,
      session
    ) {
      return {
        link: link,
        restrict: 'E',
        require: '^esnCollaborationMembershipInvitationUserNotification',
        templateUrl: '/views/modules/collaboration/user-notifications/collaboration-invitation-decline-button.html'
      };

      function link(scope, element, attrs, invitationController) {
        scope.restActive = false;
        scope.decline = function() {
          scope.restActive = true;
          esnCollaborationClientService.cancelRequestMembership(scope.invitationCollaboration.objectType, scope.invitationCollaboration._id, session.user._id).then(
            function() {
              esnUserNotificationService.setAcknowledged(scope.notification._id, true).then(
                function() {
                  scope.notification.acknowledged = true;
                  invitationController.actionDone('decline');
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
