// was collaborationMembershipRequestAcceptedNotification
(function() {
  'use strict';

  angular.module('esn.collaboration')
    .component('esnCollaborationMembershipRequestAcceptedUserNotification', esnCollaborationMembershipRequestAcceptedUserNotification());

  function esnCollaborationMembershipRequestAcceptedUserNotification() {
    return {
      controller: 'CollaborationRequestMembershipActionUserNotificationController',
      controllerAs: 'ctrl',
      bindings: {
        notification: '='
      },
      templateUrl: '/views/modules/collaboration/user-notifications/collaboration-membership-request-accepted.html'
    };
  }
})();
