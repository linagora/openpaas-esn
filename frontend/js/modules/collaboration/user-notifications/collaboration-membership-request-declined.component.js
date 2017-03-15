// was collaborationMembershipRequestDeclinedNotification
(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembershipRequestDeclinedUserNotification', esnCollaborationMembershipRequestDeclinedUserNotification());

  function esnCollaborationMembershipRequestDeclinedUserNotification() {
    return {
      bindings: {
        notification: '='
      },
      controller: 'CollaborationRequestMembershipActionUserNotificationController',
      controllerAs: 'ctrl',
      templateUrl: '/views/modules/collaboration/user-notifications/collaboration-membership-request-declined.html'
    };
  }
})();
